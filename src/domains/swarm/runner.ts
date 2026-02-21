import { generateText, stepCountIs } from "ai";
import { createXai } from "@ai-sdk/xai";
import type { AppContext } from "../../core/context";
import { createChildAgentTools } from "../../agent/tools";

/**
 * Runs a single ephemeral agent instance
 */
export async function runSubAgent(
  ctx: AppContext,
  task: string,
  systemInstruction: string,
  agentId: number
): Promise<string> {
  const xai = createXai({ apiKey: ctx.config.XAI_API_KEY });
  const model = xai(ctx.config.XAI_MODEL_NAME || "grok-beta");

  // Child tools only - no dispatch_swarm to prevent recursion
  const childTools = createChildAgentTools(ctx);

  console.log(`🐝 Agent #${agentId} starting task: "${task.substring(0, 50)}..."`);

  try {
    const { text } = await generateText({
      model,
      tools: childTools,
      stopWhen: stepCountIs(5),
      system: `
        You are a sub-agent working for Claire (the Mother Agent).
        Your ID is: #${agentId}.
        
        INSTRUCTIONS:
        ${systemInstruction}
        
        CONTEXT:
        - You have access to tools. Use them to fetch real data.
        - Be concise. Report ONLY the facts found.
        - Do not ask the user for clarification; you are running in a background process.
        - If you fail, report "FAILED: [Reason]".
      `,
      messages: [
        { role: "user", content: task }
      ],
    });

    console.log(`✅ Agent #${agentId} finished.`);
    return `[Agent #${agentId} Result]: ${text}`;

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Agent #${agentId} crashed:`, error);
    return `[Agent #${agentId} Error]: ${message}`;
  }
}
