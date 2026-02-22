// src/api/server.ts
import type { AppContext } from "../core/context";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// ── In-memory session for the demo flow ──
let demoSession = {
  intent: "",
  domain: "",
  agents: [] as Array<{
    id: string;
    name: string;
    provider: string;
    capabilities: string[];
    description: string;
    score: number;
    endpoint: string;
  }>,
  shortlistedIndices: [] as number[],
  selectedAgent: "",
  selectedAgentEndpoint: "",
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export function startApiServer(ctx: AppContext) {
  // Derive base URL from AGENTHUB_URL (strip /search suffix)
  const agentNetworkBase = ctx.config.AGENTHUB_URL.replace(/\/search\/?$/, "");

  const server = Bun.serve({
    port: 3001,
    async fetch(req) {
      const url = new URL(req.url);

      // CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      try {
        // ═══════════════════════════════════════════
        // Dev testing — emit exact frontend-driving node logs
        // ═══════════════════════════════════════════
        if (url.pathname === "/api/dev/emit-node-log" && req.method === "POST") {
          const body = (await req.json()) as {
            source?: string;
            target?: string;
            action: string;
            payload?: unknown;
          };
          if (!body?.action) {
            return json({ error: "Missing required field: action" }, 400);
          }

          const event = {
            source: body.source ?? "DevTerminal",
            target: body.target ?? "Frontend",
            action: body.action,
            payload: body.payload ?? {},
          };
          ctx.bus.emit("node:log", event);
          return json({ ok: true, emitted: event });
        }

        if (url.pathname === "/api/dev/simulate-orchestration" && req.method === "POST") {
          const body = (await req.json().catch(() => ({}))) as {
            intent?: string;
            capabilities?: string[];
            selected_agent_id?: string;
          };

          const intent = body.intent ?? "book me a flight from berlin to london";
          const capabilities = body.capabilities ?? ["travel", "booking"];
          const agentId = body.selected_agent_id ?? "agent_flight_travel";
          const sessionId = `session_${crypto.randomUUID().split("-")[0]}`;
          const netAgentUrl = `http://localhost:8000/flight/run`;

          const sequence = [
            {
              source: "Samantha",
              target: "AgentHub",
              action: "search_hub",
              payload: { intent, capabilities },
            },
            {
              source: "AgentHub",
              target: "Samantha",
              action: "search_hub_result",
              payload: {
                results_count: 1,
                matches: [agentId],
                matches_detail: [
                  {
                    agent_id: agentId,
                    endpoint: netAgentUrl,
                    confidence: 0.93,
                    capabilities: ["flight_search", "travel_planning"],
                    description: "Finds and explains flight options from a local dataset.",
                    tags: ["travel", "flights"],
                    reasoning: "High travel intent match.",
                  },
                ],
              },
            },
            {
              source: "Samantha",
              target: netAgentUrl,
              action: "netagent_request",
              payload: {
                prompt: "Find best options and explain tradeoffs.",
                session_id: sessionId,
              },
            },
            {
              source: netAgentUrl,
              target: "Samantha",
              action: "netagent_reply",
              payload: {
                session_id: sessionId,
                reply: "Top option found. Best price-to-duration route is ready for confirmation.",
              },
            },
          ];

          // Emit in order with small delays so you can watch the frontend progress.
          sequence.forEach((event, idx) => {
            setTimeout(() => ctx.bus.emit("node:log", event), idx * 900);
          });

          return json({ ok: true, emitted_count: sequence.length, sequence });
        }

        // ═══════════════════════════════════════════
        // Step 1 — POST /api/parse-intent
        // ═══════════════════════════════════════════
        if (url.pathname === "/api/parse-intent" && req.method === "POST") {
          const { message } = (await req.json()) as { message: string };

          ctx.bus.emit("node:log", {
            source: "LocalAgent",
            target: "SearchEngine",
            action: "parse_intent",
            payload: { raw_message: message },
          });

          let intent = "general_task";
          let domain = "general";

          try {
            const google = createGoogleGenerativeAI({
              apiKey: ctx.config.GOOGLE_API_KEY,
            });
            const { object } = await generateObject({
              model: google("gemini-2.0-flash"),
              schema: z.object({
                intent: z
                  .string()
                  .describe(
                    "A concise action phrase, e.g. 'find_flights', 'generate_research_plan'"
                  ),
                domain: z
                  .string()
                  .describe(
                    "The domain, e.g. 'travel', 'biotech', 'e-commerce'"
                  ),
              }),
              prompt: `Parse this user request into a structured intent and domain:\n"${message}"`,
            });
            intent = object.intent;
            domain = object.domain;
          } catch (err) {
            console.error("⚠️ AI parse-intent fallback:", err);
            const lower = message.toLowerCase();
            if (
              lower.includes("flight") ||
              lower.includes("travel") ||
              lower.includes("book")
            ) {
              intent = "find_flights";
              domain = "travel";
            } else if (
              lower.includes("research") ||
              lower.includes("biotech")
            ) {
              intent = "generate_research_plan";
              domain = "biotech";
            } else if (
              lower.includes("shop") ||
              lower.includes("buy") ||
              lower.includes("product")
            ) {
              intent = "product_search";
              domain = "e-commerce";
            }
          }

          demoSession = {
            ...demoSession,
            intent,
            domain,
            agents: [],
            shortlistedIndices: [],
            selectedAgent: "",
            selectedAgentEndpoint: "",
          };

          const result = {
            type: "intent_message",
            payload: { intent, domain },
          };

          ctx.bus.emit("node:log", {
            source: "SearchEngine",
            target: "LocalAgent",
            action: "intent_parsed",
            payload: result,
          });

          return json(result);
        }

        // ═══════════════════════════════════════════
        // Step 2 — GET /api/agents/manifest
        // ═══════════════════════════════════════════
        if (url.pathname === "/api/agents/manifest" && req.method === "GET") {
          ctx.bus.emit("node:log", {
            source: "SearchEngine",
            target: "AgentManifest",
            action: "scan_manifest",
            payload: { intent: demoSession.intent },
          });

          type AgentEntry = (typeof demoSession.agents)[number];
          let agents: AgentEntry[] = [];

          try {
            // 1. Fetch every registered agent from agent-network
            const agentsRes = await fetch(`${agentNetworkBase}/agents`);
            const rawAgents = (await agentsRes.json()) as Array<{
              id: string;
              name: string;
              endpoint: string;
              metadata: {
                description?: string;
                capabilities?: string[];
                tags?: string[];
              };
            }>;

            // 2. Fetch search results to get trust-based scores
            const searchRes = await fetch(`${agentNetworkBase}/search`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                intent: demoSession.intent || "general",
              }),
            });
            const searchResults = (await searchRes.json()) as Array<{
              agent_id: string;
              trust: number;
            }>;

            const scoreMap = new Map<string, number>();
            searchResults.forEach((r) => scoreMap.set(r.agent_id, r.trust));

            // 3. Transform, sort by score, take top 6
            agents = rawAgents
              .map((a) => ({
                id: a.id,
                name: a.name,
                provider: a.metadata?.tags?.[0] ?? "AgentGate",
                capabilities: a.metadata?.capabilities ?? [],
                description: a.metadata?.description ?? "",
                score:
                  scoreMap.get(a.id) ??
                  Math.round((Math.random() * 40 + 30)) / 100,
                endpoint: a.endpoint,
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 6);
          } catch (err) {
            console.error("⚠️ agent-network unreachable, using fallback:", err);
            agents = [
              { id: "agent_flight_travel", name: "FlightTravelAgent", provider: "travel", capabilities: ["flight_search", "travel_planning"], description: "Finds flight options from a local dataset.", score: 0.92, endpoint: `${agentNetworkBase}/flight/run` },
              { id: "sim_legal", name: "SmartLegalAgent", provider: "legal", capabilities: ["contract_analysis", "compliance_check"], description: "Handles legal and contract requests.", score: 0.76, endpoint: `${agentNetworkBase}/sim/sim_legal/run` },
              { id: "sim_health", name: "SmartHealthcareAgent", provider: "health", capabilities: ["symptom_triage", "doctor_booking"], description: "Handles healthcare and wellness requests.", score: 0.68, endpoint: `${agentNetworkBase}/sim/sim_health/run` },
              { id: "sim_ecom1", name: "SmartShoppingAgent", provider: "shopping", capabilities: ["product_search", "checkout"], description: "Handles e-commerce and shopping requests.", score: 0.61, endpoint: `${agentNetworkBase}/sim/sim_ecom1/run` },
              { id: "sim_ecom2", name: "SmartRetailAgent", provider: "retail", capabilities: ["product_search", "checkout"], description: "Handles retail product search.", score: 0.55, endpoint: `${agentNetworkBase}/sim/sim_ecom2/run` },
              { id: "sim_legal2", name: "SmartComplianceAgent", provider: "law", capabilities: ["compliance_check"], description: "Handles compliance checks.", score: 0.43, endpoint: `${agentNetworkBase}/sim/sim_legal2/run` },
            ];
          }

          // Shortlist top 5 (or fewer)
          const shortlistedIndices = agents
            .slice(0, Math.min(5, agents.length))
            .map((_, i) => i);

          demoSession.agents = agents;
          demoSession.shortlistedIndices = shortlistedIndices;

          ctx.bus.emit("node:log", {
            source: "AgentManifest",
            target: "SearchEngine",
            action: "manifest_result",
            payload: {
              total_agents: agents.length,
              shortlisted: shortlistedIndices.length,
            },
          });

          return json({
            agents: agents.map(({ id, endpoint, ...rest }) => rest),
            shortlisted_indices: shortlistedIndices,
          });
        }

        // ═══════════════════════════════════════════
        // Step 3 — POST /api/agents/select
        // ═══════════════════════════════════════════
        if (url.pathname === "/api/agents/select" && req.method === "POST") {
          const body = (await req.json()) as {
            intent: string;
            domain: string;
            candidates: string[];
          };

          const selectedAgents =
            body.candidates.length > 0
              ? body.candidates
              : demoSession.agents.slice(0, 3).map((a) => a.name);

          const confidence =
            demoSession.agents.length > 0
              ? Math.round(demoSession.agents[0].score * 100) / 100
              : 0.85;

          const topAgent =
            demoSession.agents.find((a) => selectedAgents.includes(a.name)) ??
            demoSession.agents[0];

          if (topAgent) {
            demoSession.selectedAgent = topAgent.name;
            demoSession.selectedAgentEndpoint = topAgent.endpoint;
          }

          ctx.bus.emit("node:log", {
            source: "SearchEngine",
            target: "LocalAgent",
            action: "agents_selected",
            payload: { selected_agents: selectedAgents, confidence },
          });

          return json({ selected_agents: selectedAgents, confidence });
        }

        // ═══════════════════════════════════════════
        // Step 4 — POST /api/agents/connect
        // ═══════════════════════════════════════════
        if (url.pathname === "/api/agents/connect" && req.method === "POST") {
          const body = (await req.json()) as {
            agent: string;
            context: { domain: string; task: string };
          };

          const agent =
            demoSession.agents.find((a) => a.name === body.agent) ??
            demoSession.agents[0];

          if (agent) {
            demoSession.selectedAgent = agent.name;
            demoSession.selectedAgentEndpoint = agent.endpoint;
          }

          ctx.bus.emit("node:log", {
            source: "LocalAgent",
            target: body.agent,
            action: "establish_connection",
            payload: body,
          });

          return json({
            establish_connection: true,
            agent: body.agent,
            context: body.context,
          });
        }

        // ═══════════════════════════════════════════
        // Step 5 — POST /api/agents/execute
        // ═══════════════════════════════════════════
        if (url.pathname === "/api/agents/execute" && req.method === "POST") {
          const body = (await req.json()) as {
            agent: string;
            task: string;
            domain: string;
          };

          ctx.bus.emit("node:log", {
            source: demoSession.selectedAgent || body.agent,
            target: "LocalAgent",
            action: "execute_task",
            payload: body,
          });

          let workflow: Array<{ action: string; priority: string }> = [];
          let status = "ready";

          try {
            if (demoSession.selectedAgentEndpoint) {
              const agentRes = await fetch(demoSession.selectedAgentEndpoint, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  prompt: `Execute task: ${body.task} in domain: ${body.domain}. Provide a structured workflow with prioritized actions.`,
                }),
              });
              const agentData = (await agentRes.json()) as {
                answer: string;
                session_id: string;
              };

              // Parse agent's response into workflow items
              const lines = agentData.answer
                .split("\n")
                .filter((l) => l.trim());
              workflow = lines.slice(0, 3).map((line, i) => ({
                action: line
                  .replace(/^[\d.\-*]+\s*/, "")
                  .trim()
                  .substring(0, 120),
                priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
              }));
              if (workflow.length === 0) {
                workflow = [
                  {
                    action: agentData.answer.substring(0, 120),
                    priority: "high",
                  },
                ];
              }
              status = "completed";

              ctx.bus.emit("node:log", {
                source: demoSession.selectedAgent || body.agent,
                target: "LocalAgent",
                action: "task_result",
                payload: { session_id: agentData.session_id, workflow },
              });
            }
          } catch (err) {
            console.error("⚠️ Agent execution fallback:", err);
          }

          if (workflow.length === 0) {
            workflow = [
              { action: `${body.task}_analysis`, priority: "high" },
              { action: `${body.domain}_review`, priority: "medium" },
            ];
            status = "ready";
          }

          return json({ workflow, status });
        }

        return json({ error: "Not Found" }, 404);
      } catch (err: any) {
        console.error("🔥 API Error:", err);
        return json({ error: err?.message ?? String(err) }, 500);
      }
    },
  });

  console.log(
    `🌐 API Server running on http://localhost:${server.port}`
  );
}
