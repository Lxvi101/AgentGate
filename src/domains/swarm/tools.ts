import { tool } from "ai";
import { z } from "zod";
import type { AppContext } from "../../core/context";
import { runSubAgent } from "./runner";

export const createSwarmTools = (ctx: AppContext) => {
  return {
    dispatch_swarm: tool({
      description: "Spin up a swarm of sub-agents to perform parallel tasks. Use this when you have a list of items (e.g., 5 customer names) and need to perform the SAME action on all of them.",
      inputSchema: z.object({
        tasks: z.array(z.string()).describe("An array of specific tasks. One for each agent. E.g. ['Find email for John Doe', 'Find email for Jane Smith']"),
        system_instruction: z.string().describe("The shared system prompt for all agents. Define their persona and strict output format."),
      }),
      execute: async ({ tasks, system_instruction }) => {
        const count = tasks.length;
        if (count > 10) return "❌ Too many agents requested. Max limit is 10.";

        console.log(`🚀 Spinning up swarm of ${count} agents...`);

        // Execute in parallel (with optional stagger - see comment below)
        const promises = tasks.map(async (task, index) => {
          // Stagger start times by 1 second per agent to avoid slamming APIs instantly
          await new Promise(resolve => setTimeout(resolve, index * 1000));
          return runSubAgent(ctx, task, system_instruction, index + 1);
        });

        // Wait for all to finish
        const results = await Promise.all(promises);

        // Aggregate results
        const report = results.join("\n\n---\n\n");

        return `✅ Swarm Execution Complete.\n\n${report}`;
      },
    }),
  };
};
