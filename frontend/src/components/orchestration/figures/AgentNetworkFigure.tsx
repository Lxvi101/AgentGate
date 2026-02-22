import { motion } from "framer-motion";

interface Props {
  active: boolean;
  glowing: boolean;
  showCluster: boolean;
  selectedAgent: string;
  currentStep: number;
}

const AGENTS = [
  { name: "ResearchAgent", score: 0.92, size: 18, x: 40, y: 30 },
  { name: "PlannerAgent", score: 0.76, size: 14, x: 18, y: 50 },
  { name: "DataAgent", score: 0.68, size: 12, x: 62, y: 48 },
  { name: "SynthesisAgent", score: 0.61, size: 11, x: 30, y: 68 },
  { name: "ValidationAgent", score: 0.55, size: 10, x: 55, y: 70 },
  { name: "ReportAgent", score: 0.43, size: 9, x: 42, y: 85 },
];

const AgentNetworkFigure = ({ active, glowing, showCluster, selectedAgent, currentStep }: Props) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="relative"
        animate={{
          y: active ? [0, -3, 0] : 0,
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
          <motion.g
            animate={{
              filter: glowing
                ? "drop-shadow(0 0 14px hsl(260 60% 60% / 0.6))"
                : "drop-shadow(0 0 4px hsl(260 60% 60% / 0.15))",
            }}
            transition={{ duration: 0.6 }}
          >
            {/* Head - circle with inner ring */}
            <motion.circle
              cx="40" cy="20" r="14"
              fill="hsl(260 60% 60% / 0.12)"
              stroke="hsl(260 60% 60% / 0.7)"
              strokeWidth="1.5"
              animate={{ fill: glowing ? "hsl(260 60% 60% / 0.3)" : "hsl(260 60% 60% / 0.12)" }}
            />
            <motion.circle
              cx="40" cy="20" r="6"
              fill="hsl(260 60% 60% / 0.6)"
              animate={{ fill: glowing ? "hsl(260 60% 70% / 0.9)" : "hsl(260 60% 60% / 0.6)" }}
            />
            {/* Body - inverted trapezoid */}
            <motion.path
              d="M28,38 L52,38 L48,74 L32,74 Z"
              fill="hsl(260 60% 60% / 0.08)"
              stroke="hsl(260 60% 60% / 0.5)"
              strokeWidth="1"
              animate={{ fill: glowing ? "hsl(260 60% 60% / 0.2)" : "hsl(260 60% 60% / 0.08)" }}
            />
            {/* Network lines inside body */}
            <line x1="35" y1="48" x2="45" y2="48" stroke="hsl(260 60% 60% / 0.3)" strokeWidth="0.5" />
            <line x1="40" y1="44" x2="40" y2="52" stroke="hsl(260 60% 60% / 0.3)" strokeWidth="0.5" />
            <line x1="34" y1="56" x2="46" y2="56" stroke="hsl(260 60% 60% / 0.3)" strokeWidth="0.5" />
            {/* Base */}
            <line x1="28" y1="78" x2="52" y2="78" stroke="hsl(260 60% 60% / 0.4)" strokeWidth="2" />
          </motion.g>
        </svg>
      </motion.div>
      <span className="text-xs font-mono tracking-wider uppercase text-muted-foreground">
        Agent Network
      </span>

      {/* Agent Cluster */}
      {showCluster && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-[180px] h-[120px] mt-1"
        >
          <svg width="180" height="120" viewBox="0 0 80 100" className="w-full h-full">
            {AGENTS.map((agent, i) => {
              const isSelected = agent.name === selectedAgent && currentStep >= 4;
              return (
                <motion.g key={agent.name}>
                  {/* Connection line from center top */}
                  <motion.line
                    x1="40" y1="10" x2={agent.x} y2={agent.y}
                    stroke={isSelected ? "hsl(150 70% 50% / 0.5)" : "hsl(260 60% 60% / 0.2)"}
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                  <motion.circle
                    cx={agent.x} cy={agent.y} r={agent.size / 2}
                    fill={isSelected ? "hsl(150 70% 50% / 0.4)" : "hsl(260 60% 60% / 0.15)"}
                    stroke={isSelected ? "hsl(150 70% 50% / 0.8)" : "hsl(260 60% 60% / 0.5)"}
                    strokeWidth="1"
                    initial={{ scale: 0 }}
                    animate={{
                      scale: 1,
                      filter: isSelected ? "drop-shadow(0 0 8px hsl(150 70% 50% / 0.5))" : "none",
                    }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  />
                  <motion.text
                    x={agent.x}
                    y={agent.y + agent.size / 2 + 8}
                    textAnchor="middle"
                    fill="hsl(220 15% 55%)"
                    fontSize="4"
                    fontFamily="monospace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08 + 0.3 }}
                  >
                    {agent.score.toFixed(2)}
                  </motion.text>
                </motion.g>
              );
            })}
          </svg>
        </motion.div>
      )}
    </div>
  );
};

export default AgentNetworkFigure;
