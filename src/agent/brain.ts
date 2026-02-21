// src/agent/brain.ts
import { generateText, stepCountIs, type ModelMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { AppContext } from "../core/context";
import { createAgentTools } from "./tools";

export async function runAgentTurn(
  ctx: AppContext,
  userMessage: string,
  userId: string,
  images: string[] = []
): Promise<string> {
  const google = createGoogleGenerativeAI({ apiKey: ctx.config.GOOGLE_API_KEY });
  const model = google("gemini-3-flash-preview");

  // --- Dynamic System Prompt ---
  const now = new Date();
  const SYSTEM_PROMPT = `
You are Samantha, Levi's personal AI assistant. 
You are helpful, witty, and direct.
Current System Time: ${now.toLocaleString("en-US", { timeZone: "Europe/Berlin" })}

Guidelines:
1. **Parallel Processing**: Use 'dispatch_swarm' for lists of tasks.
2. **Context**: You can see images and process text.
3. Format responses with Telegram-safe HTML only: <b>, <i>, <pre>, <code>, <br>. Do NOT use <p> or <div> (Telegram rejects them).
`;

  // 1. Load History
  const history = getHistory(ctx);

  // 2. Format User Content (Text + Images)
  const userContent: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [
    { type: "text", text: userMessage },
  ];

  if (images.length > 0) {
    for (const imgBase64 of images) {
      userContent.push({ type: "image", image: imgBase64 });
    }
  }

  // 3. Save to DB (Simplified for now - storing text representation)
  saveMessage(ctx, "user", userContent);

  // 4. Run AI
  try {
    const { text } = await generateText({
      model,
      tools: createAgentTools(ctx),
      stopWhen: stepCountIs(10),
      system: SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: userContent }],
    });

    saveMessage(ctx, "assistant", text);

    return text;
  } catch (error: any) {
    console.error("❌ AI Brain Error:", error);
    return "I'm having trouble thinking right now. Check the logs.";
  }
}

// --- Persistence Helpers ---

function getHistory(ctx: AppContext): ModelMessage[] {
  const rows = ctx.db
    .query(
      `
    SELECT role, parts FROM messages 
    ORDER BY timestamp ASC 
    LIMIT 30
  `
    )
    .all() as { role: string; parts: string }[];

  return rows.map((row) => {
    let content: ModelMessage["content"];
    try {
      content = JSON.parse(row.parts) as ModelMessage["content"];
    } catch {
      content = row.parts as ModelMessage["content"];
    }
    return {
      role: row.role as "user" | "assistant" | "system",
      content,
    } as ModelMessage;
  });
}

function saveMessage(
  ctx: AppContext,
  role: "user" | "assistant",
  content: string | Array<{ type: string; text?: string; image?: string }>
) {
  const id = crypto.randomUUID();
  const parts =
    typeof content === "string"
      ? JSON.stringify([{ type: "text", text: content }])
      : JSON.stringify(content);

  ctx.db.run(
    "INSERT INTO messages (id, role, parts) VALUES (?, ?, ?)",
    [id, role, parts]
  );
}
