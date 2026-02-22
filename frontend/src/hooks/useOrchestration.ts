import { useState, useCallback, useRef, useEffect } from "react";

export type OrchestrationStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface ConsoleEntry {
  timestamp: string;
  label: string;
  payload: object;
}

export interface AgentCard {
  name: string;
  provider: string;
  capabilities: string[];
  description: string;
  score: number;
}

// eslint-disable-next-line prefer-const
export let AGENT_MANIFEST: AgentCard[] = [
  {
    name: "ResearchAgent",
    provider: "DeepMind",
    capabilities: ["literature_review", "data_synthesis", "hypothesis_gen"],
    description: "Deep research across scientific domains with citation tracking.",
    score: 0.92,
  },
  {
    name: "PlannerAgent",
    provider: "OpenAI",
    capabilities: ["task_decomposition", "scheduling", "resource_alloc"],
    description: "Breaks complex goals into actionable multi-step plans.",
    score: 0.76,
  },
  {
    name: "DataAgent",
    provider: "Anthropic",
    capabilities: ["data_collection", "cleaning", "transformation"],
    description: "Automated data pipeline construction and management.",
    score: 0.68,
  },
  {
    name: "SynthesisAgent",
    provider: "Cohere",
    capabilities: ["summarization", "cross_reference", "insight_gen"],
    description: "Synthesizes findings from multiple agent outputs.",
    score: 0.61,
  },
  {
    name: "ValidationAgent",
    provider: "Meta AI",
    capabilities: ["fact_checking", "consistency", "bias_detection"],
    description: "Validates outputs for accuracy and logical consistency.",
    score: 0.55,
  },
  {
    name: "ReportAgent",
    provider: "Google",
    capabilities: ["formatting", "visualization", "export"],
    description: "Generates structured reports and visual summaries.",
    score: 0.43,
  },
];

// eslint-disable-next-line prefer-const
export let SHORTLISTED_INDICES = [0, 1, 2, 3, 4];

/**
 * Update the agent manifest and shortlisted indices with real API data.
 * Must be called BEFORE completeCurrentStep() so step 2 card animations use fresh data.
 */
export function setManifestData(
  agents: AgentCard[],
  shortlistedIndices: number[]
) {
  AGENT_MANIFEST = agents;
  SHORTLISTED_INDICES = shortlistedIndices;
}

export interface OrchestrationState {
  currentStep: OrchestrationStep;
  isRunning: boolean;
  isComplete: boolean;
  selectedAgent: string;
  consoleEntries: ConsoleEntry[];
  activeEdge: string | null;
  envelopeProgress: number;
  cardReadingIndex: number;
  cardFlippedIndices: number[];
  shortlistPhase: boolean;
  shortlistedIndices: number[];
}

function getStepPayloads(): { label: string; payload: object }[] {
  return [
    { label: "", payload: {} },
    {
      label: "Local Agent → Search Engine",
      payload: {
        type: "intent_message",
        payload: { intent: "generate_research_plan", domain: "biotech" },
      },
    },
    {
      label: "Search Engine → Agent Manifest",
      payload: { status: "scanning_manifest", total_agents: AGENT_MANIFEST.length },
    },
    {
      label: "Search Engine → Local Agent",
      payload: {
        selected_agents: SHORTLISTED_INDICES.map(i => AGENT_MANIFEST[i]?.name).filter(Boolean),
        confidence: 0.92,
      },
    },
    {
      label: "Local Agent → Agent Network",
      payload: {
        establish_connection: true,
        agent: AGENT_MANIFEST[0]?.name ?? "ResearchAgent",
        context: { domain: "biotech", task: "research_plan" },
      },
    },
    {
      label: "Agent Network → Local Agent",
      payload: {
        workflow: [
          { action: "literature_review", priority: "high" },
          { action: "experiment_design", priority: "medium" },
        ],
        status: "ready",
      },
    },
  ];
}

const EDGE_MAP: (string | null)[] = [
  null,
  "local-search",
  null,
  "search-local",
  "local-agent",
  "agent-local",
];

const STEP_LABELS = [
  "",
  "Local Agent → Search Engine",
  "Search Engine → Agent Manifest",
  "Search Engine → Local Agent",
  "Local Agent → Agent Network",
  "Agent Network → Local Agent",
];

export { STEP_LABELS };

const INITIAL_STATE: OrchestrationState = {
  currentStep: 0,
  isRunning: false,
  isComplete: false,
  selectedAgent: "ResearchAgent",
  consoleEntries: [],
  activeEdge: null,
  envelopeProgress: 0,
  cardReadingIndex: -1,
  cardFlippedIndices: [],
  shortlistPhase: false,
  shortlistedIndices: [],
};

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
}

export function useOrchestration() {
  const [state, setState] = useState<OrchestrationState>({ ...INITIAL_STATE });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const runningRef = useRef(false);
  const currentStepRef = useRef<number>(0);

  // Keep ref in sync with state
  useEffect(() => {
    currentStepRef.current = state.currentStep;
  }, [state.currentStep]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  }, []);

  const animateEnvelope = useCallback((duration: number) => {
    let progress = 0;
    const interval = 30;
    const increment = interval / duration;
    const id = setInterval(() => {
      progress += increment;
      if (progress >= 1) {
        progress = 0;
      }
      setState((prev) => ({ ...prev, envelopeProgress: progress }));
    }, interval);
    intervalsRef.current.push(id);
    return id;
  }, []);

  const readCardsSequentially = useCallback((onComplete: () => void) => {
    let index = 0;
    const readNext = () => {
      if (!runningRef.current) return;
      if (index >= AGENT_MANIFEST.length) {
        setState((prev) => ({
          ...prev,
          cardReadingIndex: -1,
        }));
        onComplete();
        return;
      }
      const card = AGENT_MANIFEST[index];
      const currentIndex = index;
      setState((prev) => ({
        ...prev,
        cardReadingIndex: currentIndex,
        cardFlippedIndices: [...prev.cardFlippedIndices, currentIndex],
        consoleEntries: [
          ...prev.consoleEntries,
          {
            timestamp: getTimestamp(),
            label: `Reading: ${card.name}`,
            payload: {
              agent: card.name,
              provider: card.provider,
              capabilities: card.capabilities,
              score: card.score,
            },
          },
        ],
      }));
      index++;
      timeoutRef.current = setTimeout(readNext, 1200);
    };
    readNext();
  }, []);

  const advanceToStep = useCallback((step: number) => {
    if (!runningRef.current) return;

    // Stop any running envelope animations from previous step
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    if (step > 5) {
      runningRef.current = false;
      setState((prev) => ({
        ...prev,
        isRunning: false,
        isComplete: true,
        activeEdge: null,
        envelopeProgress: 0,
      }));
      return;
    }

    const { label, payload } = getStepPayloads()[step];
    const edge = EDGE_MAP[step];

    setState((prev) => ({
      ...prev,
      currentStep: step as OrchestrationStep,
      activeEdge: edge,
      envelopeProgress: 0,
      consoleEntries: [
        ...prev.consoleEntries,
        { timestamp: getTimestamp(), label, payload },
      ],
    }));

    if (step === 2) {
      // Step 2: sequential card reading, then shortlist animation
      // Does NOT auto-advance to step 3 — waits for completeCurrentStep()
      timeoutRef.current = setTimeout(() => {
        if (!runningRef.current) return;
        readCardsSequentially(() => {
          if (!runningRef.current) return;
          setState((prev) => ({
            ...prev,
            shortlistPhase: true,
            shortlistedIndices: SHORTLISTED_INDICES,
            consoleEntries: [
              ...prev.consoleEntries,
              {
                timestamp: getTimestamp(),
                label: "Shortlist processing",
                payload: {
                  shortlisted: SHORTLISTED_INDICES.map((i) => ({
                    agent: AGENT_MANIFEST[i].name,
                    score: AGENT_MANIFEST[i].score,
                  })),
                  rejected: AGENT_MANIFEST[5] ? [AGENT_MANIFEST[5].name] : [],
                },
              },
            ],
          }));
          // Waiting for completeCurrentStep() — no auto-advance
        });
      }, 800);
    } else {
      // Normal steps: start envelope loop, wait for completeCurrentStep()
      if (edge) animateEnvelope(2000);
      // No auto-advance setTimeout
    }
  }, [animateEnvelope, readCardsSequentially]);

  const completeCurrentStep = useCallback((responseData?: { label: string; payload: object }) => {
    if (!runningRef.current) return;

    const step = currentStepRef.current;

    // Stop current envelope animation
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Add response data to console if provided
    if (responseData) {
      setState((prev) => ({
        ...prev,
        consoleEntries: [
          ...prev.consoleEntries,
          { timestamp: getTimestamp(), label: responseData.label, payload: responseData.payload },
        ],
      }));
    }

    // Advance to next step after a brief pause
    setTimeout(() => {
      advanceToStep(step + 1);
    }, 300);
  }, [advanceToStep]);

  const start = useCallback(() => {
    clearAllTimers();
    runningRef.current = true;
    currentStepRef.current = 0;
    setState({ ...INITIAL_STATE, isRunning: true });
    timeoutRef.current = setTimeout(() => {
      if (runningRef.current) advanceToStep(1);
    }, 800);
  }, [advanceToStep, clearAllTimers]);

  const replay = useCallback(() => {
    clearAllTimers();
    runningRef.current = false;
    setState({ ...INITIAL_STATE });
  }, [clearAllTimers]);

  return { state, start, replay, completeCurrentStep };
}
