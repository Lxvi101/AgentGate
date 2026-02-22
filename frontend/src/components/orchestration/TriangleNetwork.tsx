import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import SearchEngineFigure from "./figures/SearchEngineFigure";
import LocalAgentFigure from "./figures/LocalAgentFigure";
import AgentNetworkFigure from "./figures/AgentNetworkFigure";
import AgentManifestCards from "./AgentManifestCards";
import AgentCircles, { AGENT_CIRCLE_POSITIONS } from "./AgentCircles";
import { AGENT_MANIFEST, type OrchestrationState } from "@/hooks/useOrchestration";

interface Props {
  state: OrchestrationState;
}

const VERTICES = {
  search: { x: 350, y: 70 },
  local: { x: 100, y: 420 },
  network: { x: 600, y: 420 },
};

const STATIC_PATHS: Record<string, string> = {
  "local-search": `M ${VERTICES.local.x} ${VERTICES.local.y} C ${VERTICES.local.x - 30} ${VERTICES.local.y - 140}, ${VERTICES.search.x - 100} ${VERTICES.search.y + 80}, ${VERTICES.search.x} ${VERTICES.search.y}`,
  "search-local": `M ${VERTICES.search.x} ${VERTICES.search.y} C ${VERTICES.search.x - 100} ${VERTICES.search.y + 80}, ${VERTICES.local.x - 30} ${VERTICES.local.y - 140}, ${VERTICES.local.x} ${VERTICES.local.y}`,
  "local-network": `M ${VERTICES.local.x} ${VERTICES.local.y} C ${VERTICES.local.x + 100} ${VERTICES.local.y + 50}, ${VERTICES.network.x - 100} ${VERTICES.network.y + 50}, ${VERTICES.network.x} ${VERTICES.network.y}`,
  "network-local": `M ${VERTICES.network.x} ${VERTICES.network.y} C ${VERTICES.network.x - 100} ${VERTICES.network.y + 50}, ${VERTICES.local.x + 100} ${VERTICES.local.y + 50}, ${VERTICES.local.x} ${VERTICES.local.y}`,
  "search-network": `M ${VERTICES.search.x} ${VERTICES.search.y} C ${VERTICES.search.x + 100} ${VERTICES.search.y + 80}, ${VERTICES.network.x + 30} ${VERTICES.network.y - 140}, ${VERTICES.network.x} ${VERTICES.network.y}`,
};

const BASE_EDGES = ["local-search", "search-network", "local-network"];

const EnvelopeOnPath = ({ pathD, progress }: { pathD: string; progress: number }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const totalLength = path.getTotalLength();
    const point = path.getPointAtLength(progress * totalLength);
    setPos({ x: point.x, y: point.y });
  }, [progress, pathD]);

  return (
    <>
      <path ref={pathRef} d={pathD} fill="none" stroke="none" />
      <g transform={`translate(${pos.x}, ${pos.y})`}>
        <rect
          x="-10" y="-7" width="20" height="14" rx="2"
          fill="hsl(210 100% 60% / 0.9)"
          stroke="hsl(210 100% 70%)"
          strokeWidth="1"
          filter="url(#glow)"
        />
        <path d="M-7,-5 L0,1 L7,-5" fill="none" stroke="hsl(210 100% 85%)" strokeWidth="1" />
      </g>
    </>
  );
};

const TriangleNetwork = ({ state }: Props) => {
  const {
    activeEdge,
    envelopeProgress,
    currentStep,
    selectedAgent,
    cardReadingIndex,
    cardFlippedIndices,
    shortlistPhase,
    shortlistedIndices,
  } = state;

  // Build dynamic paths for agent-circle targeting
  const PATHS = useMemo(() => {
    // Envelope targets the Agent Network vertex since circles are now overlaid on the figure
    const target = VERTICES.network;

    return {
      ...STATIC_PATHS,
      "local-agent": `M ${VERTICES.local.x} ${VERTICES.local.y} C ${VERTICES.local.x + 140} ${VERTICES.local.y - 60}, ${target.x - 60} ${target.y + 50}, ${target.x} ${target.y}`,
      "agent-local": `M ${target.x} ${target.y} C ${target.x - 60} ${target.y + 50}, ${VERTICES.local.x + 140} ${VERTICES.local.y - 60}, ${VERTICES.local.x} ${VERTICES.local.y}`,
    };
  }, [selectedAgent]);

  const searchGlowing = currentStep >= 1 && currentStep <= 3;
  const localGlowing = currentStep === 1 || currentStep === 3 || currentStep === 4 || currentStep === 5;
  const networkGlowing = currentStep === 4 || currentStep === 5;

  const resolvedPath = activeEdge ? PATHS[activeEdge] : null;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Agent Manifest Cards — above the triangle */}
      {currentStep === 2 ? (
        <div className="flex-shrink-0 px-4 pb-2 min-h-[96px] flex items-end justify-center">
          <div className="border border-border/40 rounded-lg bg-card/30 backdrop-blur-sm px-3 pt-1.5 pb-2">
            <div className="text-[10px] font-mono font-semibold text-muted-foreground mb-1.5 text-center tracking-wider uppercase">
              Agent Cards
            </div>
            <AgentManifestCards
              visible={true}
              readingIndex={cardReadingIndex}
              flippedIndices={cardFlippedIndices}
              shortlistPhase={shortlistPhase}
              shortlistedIndices={shortlistedIndices}
            />
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 min-h-[96px]" />
      )}

      {/* Triangle area */}
      <div className="relative flex-1">
        <svg
          viewBox="0 0 700 500"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base edges */}
          {BASE_EDGES.map((key) => (
            <path
              key={`bg-${key}`}
              d={STATIC_PATHS[key]}
              fill="none"
              stroke="hsl(230 25% 18%)"
              strokeWidth="1"
              strokeDasharray="6 8"
              opacity={0.3}
            />
          ))}

          {/* Active edge */}
          {activeEdge && resolvedPath && (
            <motion.path
              key={activeEdge}
              d={resolvedPath}
              fill="none"
              stroke="hsl(210 100% 60%)"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              filter="url(#glow)"
            />
          )}

          {/* Envelope */}
          {activeEdge && resolvedPath && envelopeProgress > 0 && envelopeProgress < 1 && (
            <EnvelopeOnPath pathD={resolvedPath} progress={envelopeProgress} />
          )}
        </svg>

        {/* Figures */}
        <div className="absolute" style={{ top: "0%", left: "50%", transform: "translateX(-50%)" }}>
          <SearchEngineFigure active={currentStep >= 1} glowing={searchGlowing} />
        </div>
        <div className="absolute" style={{ bottom: "4%", left: "4%" }}>
          <LocalAgentFigure
            active={currentStep >= 1}
            glowing={localGlowing}
            executionReady={state.isComplete}
          />
        </div>
        <div className="absolute" style={{ bottom: "4%", right: "4%" }}>
          <AgentNetworkFigure
            active={currentStep >= 4}
            glowing={networkGlowing}
            showCluster={false}
            selectedAgent={selectedAgent}
            currentStep={currentStep}
          />
          {/* Agent circles overlaid on the Agent Network figure */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
              <AgentCircles
                visible={currentStep >= 4}
                selectedAgent={selectedAgent}
                currentStep={currentStep}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriangleNetwork;
