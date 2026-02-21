// src/domains/telegram/bot.ts
import { Bot, InlineKeyboard } from "grammy";
import type { AppContext } from "../../core/context";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// --- Types ---
interface MessageBuffer {
  timer: ReturnType<typeof setTimeout> | null;
  textParts: string[];
  imageBuffers: ArrayBuffer[];
  voicePromised: Promise<string>[]; // Promises resolving to transcribed text
}

// Global Buffer Map: ChatID -> Buffer
const chatBuffers = new Map<number, MessageBuffer>();

// Debounce wait time (seconds) - allows user to send multiple short messages/photos
const DEBOUNCE_MS = 4000;

export function createBot(token: string) {
  return new Bot(token);
}

export function registerTelegramListeners(ctx: AppContext) {
  // 1. Handle Approval Requests
  ctx.bus.on("approval:requested", async ({ id, description }) => {
    const chatId = ctx.config.TELEGRAM_CHAT_ID;
    const keyboard = new InlineKeyboard()
      .text("✅ Approve", `approve:${id}`)
      .text("❌ Deny", `deny:${id}`);

    try {
      await ctx.bot.api.sendMessage(
        chatId,
        `🛡️ <b>Approval Requested</b>\n\n${description}`,
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
        }
      );
    } catch (error) {
      console.error("Failed to send approval message:", error);
    }
  });

  // 2. Handle Approval Decisions
  ctx.bot.on("callback_query:data", async (botCtx) => {
    const data = botCtx.callbackQuery.data;
    const [action, requestId] = data.split(":");
    if (!requestId) return botCtx.answerCallbackQuery();

    const isApproved = action === "approve";
    const statusText = isApproved ? "✅ Approved" : "❌ Denied";
    await botCtx.answerCallbackQuery({ text: statusText });
    await botCtx.editMessageText(
      `${botCtx.callbackQuery.message?.text}\n\n<b>${statusText}</b>`,
      { parse_mode: "HTML" }
    );
    ctx.bus.emit("approval:decision", { id: requestId, approved: isApproved });
  });

  // --- NEW: Handle /reset Command ---
  ctx.bot.command("reset", async (botCtx) => {
    // Security Check
    if (botCtx.chat.id.toString() !== ctx.config.TELEGRAM_CHAT_ID) return;

    console.log("🧹 Manual Context Reset Triggered");

    try {
      // 1. Clear the messages table (History)
      ctx.db.run("DELETE FROM messages");

      // 2. Clear any pending buffers for this chat
      if (chatBuffers.has(botCtx.chat.id)) {
        chatBuffers.delete(botCtx.chat.id);
      }

      await botCtx.reply(
        "🧹 <b>Context Cleared</b>\nI've wiped my short-term memory (conversation history). Memories & Notes remain intact.",
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("Failed to reset context:", error);
      await botCtx.reply("❌ Error clearing context. Check logs.");
    }
  });

  ctx.bot.hears("#chatid", async (botCtx) => {
    const chatId = botCtx.chat.id;
    await botCtx.reply(`Your Telegram Chat ID is: <code>${chatId}</code>`, { 
      parse_mode: "HTML" 
    });
  });

  // 3. LISTEN TO EVERYTHING (Text, Photo, Voice)
  // We attach to "message" to catch all types
  ctx.bot.on("message", async (botCtx) => {
    const chatId = botCtx.chat.id;
    // Security Check
    if (botCtx.chat.id.toString() !== ctx.config.TELEGRAM_CHAT_ID) return;

    // --- NEW: Ignore Commands ---
    // This prevents the "/reset" text from also being sent to the AI Brain
    if (botCtx.message.text?.startsWith("/")) return;

    // Initialize Buffer if empty
    if (!chatBuffers.has(chatId)) {
      chatBuffers.set(chatId, {
        timer: null,
        textParts: [],
        imageBuffers: [],
        voicePromised: [],
      });
    }

    const buffer = chatBuffers.get(chatId)!;

    // --- A. Handle Text ---
    if (botCtx.message.text) {
      buffer.textParts.push(botCtx.message.text);
    }
    // Handle Caption (if photo has text)
    else if (botCtx.message.caption) {
      buffer.textParts.push(botCtx.message.caption);
    }

    // --- B. Handle Photos ---
    if (botCtx.message.photo) {
      const largestPhoto =
        botCtx.message.photo[botCtx.message.photo.length - 1];
      if (!largestPhoto) return;
      console.log("📸 Receiving Photo...");

      try {
        const file = await botCtx.api.getFile(largestPhoto.file_id);
        if (file.file_path) {
          const url = `https://api.telegram.org/file/bot${ctx.config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
          const res = await fetch(url);
          const arrayBuffer = await res.arrayBuffer();
          buffer.imageBuffers.push(arrayBuffer);
        }
      } catch (e) {
        console.error("Failed to download photo", e);
      }
    }

    // --- C. Handle Voice ---
    if (botCtx.message.voice) {
      console.log("🎙️ Receiving Voice Memo...");
      const promise = (async () => {
        try {
          const file = await botCtx.api.getFile(
            botCtx.message.voice!.file_id
          );
          if (!file.file_path) return "[Audio Error]";

          const url = `https://api.telegram.org/file/bot${ctx.config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
          const res = await fetch(url);
          const arrayBuffer = await res.arrayBuffer();

          return await transcribeAudio(
            ctx,
            arrayBuffer,
            botCtx.message.voice!.mime_type || "audio/ogg"
          );
        } catch (e) {
          console.error("Transcription failed", e);
          return "[Audio Transcription Failed]";
        }
      })();
      buffer.voicePromised.push(promise);
    }

    // --- D. DEBOUNCE LOGIC ---
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }

    buffer.timer = setTimeout(async () => {
      await flushMessageBuffer(ctx, chatId);
    }, DEBOUNCE_MS);
  });

  console.log("👂 Telegram listeners registered (Multi-modal + Debounce)");
}

/**
 * Flushes the buffer: Aggregates text, waits for transcriptions, prepares images, emits event.
 */
async function flushMessageBuffer(ctx: AppContext, chatId: number) {
  const buffer = chatBuffers.get(chatId);
  if (!buffer) return;

  chatBuffers.delete(chatId);

  // 1. Resolve Voice Transcriptions
  const transcribedParts = await Promise.all(buffer.voicePromised);

  // 2. Combine all text
  const fullText = [
    ...buffer.textParts,
    ...transcribedParts.map((t) => `[Voice Memo]: ${t}`),
  ].join("\n\n");

  if (!fullText && buffer.imageBuffers.length === 0) return;

  // 3. Convert Images to Base64
  const imagesBase64 = buffer.imageBuffers.map((buf) =>
    Buffer.from(buf).toString("base64")
  );

  console.log(
    `📤 Flushing Buffer: ${fullText.length} chars, ${imagesBase64.length} images`
  );

  // 4. Emit Event
  ctx.bus.emit("agent:message_received", {
    text: fullText || "(User sent media)",
    images: imagesBase64,
    chatId,
    userId: ctx.config.TELEGRAM_CHAT_ID,
  });
}

/**
 * Helper: Transcribe audio using Gemini directly
 */
async function transcribeAudio(
  ctx: AppContext,
  audioBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const google = createGoogleGenerativeAI({
    apiKey: ctx.config.GOOGLE_API_KEY,
  });
  const model = google("gemini-2.0-flash-001");

  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe this audio message exactly. Do not add commentary.",
          },
          {
            type: "file",
            data: audioBuffer,
            mediaType: mimeType,
          },
        ],
      },
    ],
  });
  return text;
}
