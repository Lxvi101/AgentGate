// src/main.ts
import { config } from "./core/config";
import { initDatabase } from "./core/database";
import { AppEventBus } from "./core/events";
import { initNodeNetLogger } from "./core/logger";
import { createBot, registerTelegramListeners } from "./domains/telegram/bot";
import { sanitizeHtmlForTelegram } from "./domains/telegram/html";
import { runAgentTurn } from "./agent/brain";
import { startScheduler } from "./domains/reminders/scheduler";
import { startApiServer } from "./api/server";
import type { AppContext } from "./core/context";

async function bootstrap() {
  console.log("🚀 Starting AgentGate...");

  // 1. Initialize Infrastructure
  const db = initDatabase();
  const bus = new AppEventBus();
  const bot = createBot(config.TELEGRAM_BOT_TOKEN);

  // 2. Create the Spine (Context)
  const ctx: AppContext = {
    db,
    bus,
    config,
    bot,
  };

  // Initialize the Node Net Logger
  initNodeNetLogger(ctx);

  // Start the REST API server (frontend ↔ agent-network bridge)
  startApiServer(ctx);

  // 3. Register Domain Listeners
  registerTelegramListeners(ctx);

  // Register Pipelines (Hooks)
  // registerEmailPipeline(ctx);

  // 4. Wire: Telegram Event -> AI Brain
  ctx.bus.on(
    "agent:message_received",
    async ({ text, images, chatId, userId }) => {
      console.log(
        `🧠 Processing message from ${userId}: "${text.substring(0, 50)}..." [Images: ${images?.length || 0}]`
      );

      // Show "typing..." status in Telegram
      await ctx.bot.api.sendChatAction(chatId, "typing");

      // Run the AI (Pass images now)
      const response = await runAgentTurn(
        ctx,
        text,
        userId,
        images ?? []
      );

      // Send Response back to Telegram (sanitize: AI may use <p> etc. which Telegram rejects)
      await ctx.bot.api.sendMessage(chatId, sanitizeHtmlForTelegram(response), {
        parse_mode: "HTML",
      });
    }
  );

  // 5. Wire: Approval Events logging (Optional debug)
  ctx.bus.on("approval:requested", (data) => console.log("👀 Approval Requested:", data.id));
  ctx.bus.on("approval:decision", (data) => console.log("👉 Approval Decision:", data));

  // 6. Start Background Services
  startScheduler(ctx);

  // 7. Wire: Actionable Email -> Brain
  ctx.bus.on("email:actionable", async (email) => {
    // We notify the Admin (Levi)
    await ctx.bot.api.sendMessage(
      ctx.config.TELEGRAM_CHAT_ID, 
      `📧 <b>Valid ${email.category.toUpperCase()}</b>\nFrom: ${email.from}\nSubj: ${email.subject}\n\n<i>${email.summary}</i>`, 
      { parse_mode: "HTML" }
    );

    // Give Samantha the highly compressed, pre-fetched context
    const prompt = `
[SYSTEM EVENT: Actionable Email]
From: ${email.from}
Category: ${email.category}
Summary: ${email.summary}
Enriched System Context:
${email.enrichedContext || "No extra context available."}

Based on this summary and context, decide if you need to reply via email tools or take action.
`;

    // Trigger AI Agent
    const response = await runAgentTurn(ctx, prompt, "system-email-trigger");
    
    // Send AI thought process/action result to Telegram
    if (response) {
      await ctx.bot.api.sendMessage(
        ctx.config.TELEGRAM_CHAT_ID,
        `🤖 <b>Samantha's Action:</b>\n${sanitizeHtmlForTelegram(response)}`,
        { parse_mode: "HTML" }
      );
    }
  });

  // 8. Wire: Reminder -> Brain
  ctx.bus.on("reminder:triggered", async ({ note }) => {
    const prompt = `[SYSTEM EVENT] Reminder Triggered: "${note}".\nPerform the task requested in the reminder.`;
    
    await ctx.bot.api.sendMessage(ctx.config.TELEGRAM_CHAT_ID, `⏰ <b>Reminder:</b> ${note}`, { parse_mode: "HTML" });

    const response = await runAgentTurn(ctx, prompt, "system-reminder-trigger");

    if (response) {
      await ctx.bot.api.sendMessage(
        ctx.config.TELEGRAM_CHAT_ID,
        `🤖 <b>Samantha's Response:</b>\n${sanitizeHtmlForTelegram(response)}`,
        { parse_mode: "HTML" }
      );
    }
  });

  // 9. Start the Bot
  await bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Samantha is live as @${botInfo.username}`);
    },
  });
}

// Handle shutdown gracefully
process.on("SIGINT", () => {
  console.log("🛑 Shutting down...");
  process.exit(0);
});

bootstrap().catch((err) => {
  console.error("🔥 Fatal Error:", err);
  process.exit(1);
});
