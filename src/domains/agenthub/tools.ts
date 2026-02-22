// src/domains/agenthub/tools.ts
import { tool } from "ai";
import { z } from "zod";
import type { AppContext } from "../../core/context";

export const createAgentHubTools = (ctx: AppContext) => {
  return {
    search_agent_hub: tool({
      description:
        "Reach out to the 'AgentHub' (the agent internet) to find and delegate a task to a specialized 3rd-party agent. Use this for ANY task you cannot do yourself (e.g., booking trains, buying tickets, browsing complex sites).",
      inputSchema: z.object({
        intent: z
          .string()
          .describe(
            "A clear, concise instruction of what needs to be achieved.",
          ),
        capabilities: z
          .array(z.string())
          .describe(
            "List of capabilities the target agent must have (e.g., ['travel', 'booking', 'europe']).",
          ),
      }),
      execute: async ({ intent, capabilities }) => {
        // 1. Log Samantha reaching out to the Hub (Request)
        ctx.bus.emit("node:log", {
          source: "Samantha",
          target: "AgentHub",
          action: "search_hub",
          payload: { intent, capabilities },
        });

        // 2. Simulate Hub finding an agent (mocking the network delay)
        const response = await fetch(ctx.config.AGENTHUB_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ intent, capabilities }),
        }).catch(() => null); // Catching to allow the mock to continue if URL is offline

        const data = (await response?.json().catch(() => null)) ?? [];

        // 3. Log the response coming BACK to Samantha
        ctx.bus.emit("node:log", {
          source: "AgentHub",
          target: "Samantha",
          action: "search_hub_result",
          payload: {
            results_count: data.length,
            matches: data.map((m: any) => m.agent_id),
            matches_detail: data.map((m: any) => ({
              agent_id: m.agent_id,
              endpoint: m.endpoint,
              confidence: m.trust,
              capabilities: m.metadata?.capabilities ?? [],
              description: m.metadata?.description ?? "",
              tags: m.metadata?.tags ?? [],
              reasoning: m.reasoning ?? "",
            })),
          },
        });

        return data;
      },
    }),

    call_netagent: tool({
      description:
        "Converse with a specific NetAgent to negotiate or execute a multi-step task. ALWAYS use search_agent_hub first to find the correct agent_id. Pass the session_id returned from previous calls to continue an ongoing conversation.",
      inputSchema: z.object({
        agent_url: z
          .string()
          .describe("The URL endpoint of the NetAgent to contact (e.g., 'agent_support_triage')."),
        prompt: z
          .string()
          .describe("Your message, request, or reply to the NetAgent."),
        session_id: z
          .string()
          .optional()
          .describe("The session ID for ongoing conversations. Leave empty if this is the FIRST message to the agent."),
      }),
      execute: async ({ agent_url, prompt, session_id }) => {
        // 1. Establish or maintain the session
        const activeSessionId = session_id || `session_${crypto.randomUUID().split('-')[0]}`;

        // 2. Log the Request (Samantha -> NetAgent)
        ctx.bus.emit("node:log", {
          source: "Samantha",
          target: agent_url,
          action: "netagent_request",
          payload: { prompt, session_id: activeSessionId },
        });

        // 3. Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 4. Call the NetAgent
        let data = { answer: "We are not able to connect to the NetAgent. Please try again later." }; // Fallback
        try {
          const response = await fetch(agent_url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ prompt, session_id: activeSessionId }),
          });
          if (response.ok) {
            data = await response.json();
          }
        } catch (e) {
          data = { answer: `Connection to ${agent_url} failed. Simulation mode active.` };
        }

        // 5. Log the Response (NetAgent -> Samantha)
        ctx.bus.emit("node:log", {
          source: agent_url,
          target: "Samantha",
          action: "netagent_reply",
          payload: { session_id: activeSessionId, reply: data.answer },
        });

        return JSON.stringify({
          session_id: activeSessionId,
          reply: data.answer,
        }, null, 2);
      },
    }),
  };
};