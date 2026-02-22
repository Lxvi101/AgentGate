import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  useOrchestration,
  AGENT_MANIFEST,
  setManifestData,
  type AgentCard,
} from "@/hooks/useOrchestration";
import BackgroundGrid from "@/components/orchestration/BackgroundGrid";
import TriangleNetwork from "@/components/orchestration/TriangleNetwork";
import ConsolePanel from "@/components/orchestration/ConsolePanel";
import StepsPanel from "@/components/orchestration/StepsPanel";

type NodeLogEvent = {
  id?: string;
  timestamp?: string;
  source: string;
  target: string;
  action: string;
  payload: any;
};

type MatchDetail = {
  agent_id: string;
  endpoint?: string;
  confidence?: number;
  capabilities?: string[];
  description?: string;
  tags?: string[];
  reasoning?: string;
};

const Index = () => {
  const { state, start, replay, completeCurrentStep } = useOrchestration();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastSource, setLastSource] = useState("waiting-for-telegram");
  const eventQueueRef = useRef<Array<{ step: number; label: string; payload: object }>>([]);

  const handleReset = useCallback(() => {
    eventQueueRef.current = [];
    replay();
  }, [replay]);

  const enqueueStep = useCallback(
    (step: number, label: string, payload: object) => {
      eventQueueRef.current.push({ step, label, payload });
      if (!state.isRunning) start();
    },
    [start, state.isRunning]
  );

  // Live WebSocket stream from Bun backend (node:log)
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data as string) as NodeLogEvent;
        setLastSource(`${event.source} → ${event.target}`);

        // Start orchestration from real backend activity.
        if (event.action === "search_hub") {
          enqueueStep(1, "Local Agent → Search Engine", {
            type: "intent_message",
            payload: event.payload,
          });
          return;
        }

        if (event.action === "search_hub_result") {
          const matchDetails: MatchDetail[] = Array.isArray(event.payload?.matches_detail)
            ? event.payload.matches_detail
            : [];
          const selectedAgents: string[] = Array.isArray(event.payload?.matches)
            ? event.payload.matches
            : [];

          if (matchDetails.length > 0) {
            const cards: AgentCard[] = matchDetails.map((m, idx) => ({
              name: m.agent_id,
              provider: m.tags?.[0] ?? "AgentNetwork",
              capabilities: m.capabilities ?? [],
              description: m.description || m.reasoning || "Agent discovered via AgentHub search.",
              score: typeof m.confidence === "number" ? m.confidence : Math.max(0.3, 0.9 - idx * 0.1),
            }));
            const shortlisted = cards
              .slice(0, Math.min(5, cards.length))
              .map((_, i) => i);
            setManifestData(cards, shortlisted);
          }

          enqueueStep(2, "Search Engine → Agent Manifest", {
            status: "scanning_manifest",
            total_agents: event.payload?.results_count ?? AGENT_MANIFEST.length,
            matches: selectedAgents,
          });

          enqueueStep(3, "Search Engine → Local Agent", {
            selected_agents: selectedAgents,
            confidence: selectedAgents.length > 0 ? 0.92 : 0.5,
          });
          return;
        }

        if (event.action === "netagent_request") {
          enqueueStep(4, "Local Agent → Agent Network", {
            establish_connection: true,
            agent: event.target,
            context: event.payload,
          });
          return;
        }

        if (event.action === "netagent_reply") {
          const reply = String(event.payload?.reply ?? "Agent replied.");
          enqueueStep(5, "Agent Network → Local Agent", {
            workflow: [{ action: reply.slice(0, 140), priority: "high" }],
            status: "ready",
          });
        }
      } catch {
        // Ignore malformed websocket events
      }
    };

    return () => ws.close();
  }, [enqueueStep]);

  // Process queued backend events in order, aligned with current step.
  useEffect(() => {
    if (!state.isRunning || state.isComplete) return;
    const next = eventQueueRef.current[0];
    if (!next) return;
    if (next.step !== state.currentStep) return;

    // Step 2 waits until shortlist animation is visible.
    if (next.step === 2 && !state.shortlistPhase) return;

    eventQueueRef.current.shift();
    completeCurrentStep({ label: next.label, payload: next.payload });
  }, [
    state.isRunning,
    state.isComplete,
    state.currentStep,
    state.shortlistPhase,
    completeCurrentStep,
  ]);

  // Fallback: if no search_hub_result arrived, don't block forever on step 2.
  useEffect(() => {
    if (
      eventQueueRef.current.length === 0 &&
      state.shortlistPhase &&
      state.isRunning &&
      !state.isComplete &&
      state.currentStep === 2
    ) {
      const timer = setTimeout(() => {
        completeCurrentStep({
          label: "Search Engine → Agent Manifest",
          payload: {
            status: "manifest_scanned",
            shortlisted: AGENT_MANIFEST.slice(0, 5).map((a) => ({
              name: a.name,
              score: a.score,
            })),
          },
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [
    state.consoleEntries,
    state.shortlistPhase,
    state.isRunning,
    state.isComplete,
    state.currentStep,
    completeCurrentStep,
  ]);

  // ── UI (unchanged layout) ──
  return (
    <div className="relative min-h-screen h-screen overflow-hidden">
      <BackgroundGrid />

      {/* Top Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-border/30"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${wsConnected ? "bg-accent animate-pulse" : "bg-destructive"}`}
          />
          <h1 className="text-sm font-mono font-semibold tracking-wider uppercase text-foreground">
            AI Agent Orchestration Console
          </h1>
          <span className="text-[10px] text-muted-foreground">
            {wsConnected ? "live-from-bun-backend" : "ws-disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden md:inline">
            {lastSource}
          </span>
          {(state.isComplete || state.isRunning || state.consoleEntries.length > 0) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md glass-surface text-foreground text-xs font-mono hover:bg-muted/50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset View
            </button>
          )}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-md glass-surface text-muted-foreground hover:text-foreground transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Three-Column Layout */}
      <div className="relative z-10 flex h-[calc(100vh-49px)]">
        {/* LEFT: Steps Panel (22%) */}
        <div className="w-[22%] h-full p-3">
          <StepsPanel
            currentStep={state.currentStep}
            isComplete={state.isComplete}
          />
        </div>

        {/* CENTER: Triangle Network (56%) */}
        <div className="w-[56%] h-full py-3">
          <TriangleNetwork state={state} />
        </div>

        {/* RIGHT: Console Panel (22%) */}
        <div className="w-[22%] h-full p-3 pl-0">
          <ConsolePanel entries={state.consoleEntries} />
        </div>
      </div>
    </div>
  );
};

export default Index;
