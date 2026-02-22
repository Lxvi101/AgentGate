import { motion } from "framer-motion";
import StepLabel from "./StepLabel";

interface AgentNode {
  name: string;
  size: number;
  relevance: number;
  x: number;
  y: number;
  blobPath: string;
}

const agents: AgentNode[] = [
  {
    name: "Research Agent",
    size: 64,
    relevance: 0.95,
    x: 50,
    y: 30,
    blobPath: "M45,20 C60,10 80,25 75,45 C70,65 50,75 35,65 C20,55 25,30 45,20Z",
  },
  {
    name: "Planner Agent",
    size: 50,
    relevance: 0.7,
    x: 18,
    y: 55,
    blobPath: "M40,15 C65,10 75,35 65,55 C55,75 30,70 20,50 C10,30 20,20 40,15Z",
  },
  {
    name: "Data Agent",
    size: 50,
    relevance: 0.65,
    x: 82,
    y: 50,
    blobPath: "M35,18 C55,5 80,20 75,45 C70,70 45,78 25,60 C5,42 15,30 35,18Z",
  },
  {
    name: "Validator Agent",
    size: 38,
    relevance: 0.4,
    x: 14,
    y: 25,
    blobPath: "M42,15 C62,8 78,30 68,52 C58,74 32,72 22,52 C12,32 22,22 42,15Z",
  },
  {
    name: "Simulation Agent",
    size: 38,
    relevance: 0.35,
    x: 78,
    y: 78,
    blobPath: "M38,18 C58,5 78,25 72,48 C66,71 40,76 24,58 C8,40 18,30 38,18Z",
  },
  {
    name: "Execution Agent",
    size: 34,
    relevance: 0.3,
    x: 42,
    y: 80,
    blobPath: "M44,12 C66,8 76,32 68,55 C60,78 34,78 22,55 C10,32 22,16 44,12Z",
  },
];

interface StepDiscoveryNetworkProps {
  active: boolean;
}

const StepDiscoveryNetwork = ({ active }: StepDiscoveryNetworkProps) => {
  if (!active) return null;

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-lg"
      >
        <h3 className="text-sm font-semibold text-foreground text-center mb-6 tracking-wide">
          Agent Discovery Network
        </h3>

        <div className="relative h-[340px] rounded-xl border border-border/50 glass-surface overflow-hidden">
          {/* Connection lines from top center to agents */}
          <svg className="absolute inset-0 w-full h-full">
            {agents.map((agent, i) => (
              <motion.line
                key={`line-${i}`}
                x1="50%"
                y1="8%"
                x2={`${agent.x}%`}
                y2={`${agent.y}%`}
                stroke={agent.relevance > 0.8 ? "hsl(var(--primary))" : "hsl(var(--path-dot))"}
                strokeWidth="1"
                strokeDasharray="4 6"
                initial={{ opacity: 0 }}
                animate={{ opacity: agent.relevance > 0.8 ? 0.6 : 0.15 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.6 }}
              />
            ))}
          </svg>

          {/* Agent blob nodes */}
          {agents.map((agent, i) => {
            const isHighRelevance = agent.relevance > 0.8;
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 150, damping: 14 }}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${agent.x}%`,
                  top: `${agent.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.div
                  animate={
                    isHighRelevance
                      ? {
                          filter: [
                            "drop-shadow(0 0 6px hsl(210 100% 60% / 0.3))",
                            "drop-shadow(0 0 18px hsl(210 100% 60% / 0.6))",
                            "drop-shadow(0 0 6px hsl(210 100% 60% / 0.3))",
                          ],
                        }
                      : { y: [0, -5, 0] }
                  }
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: agent.size, height: agent.size }}
                  className="relative"
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                  >
                    <motion.path
                      d={agent.blobPath}
                      fill={isHighRelevance ? "hsl(210 100% 60% / 0.18)" : "hsl(230 30% 30% / 0.35)"}
                      stroke={isHighRelevance ? "hsl(210 100% 60% / 0.5)" : "hsl(230 20% 40% / 0.3)"}
                      strokeWidth="1.5"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    />
                    <text
                      x="50"
                      y="48"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-foreground/80"
                      style={{ fontSize: agent.size > 50 ? "8px" : "7px", fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {agent.name.split(" ")[0]}
                    </text>
                  </svg>
                </motion.div>
                <span className="text-[9px] text-muted-foreground mt-1 whitespace-nowrap">
                  {agent.name}
                </span>
                <span className="text-[8px] text-muted-foreground/60 font-mono">
                  {(agent.relevance * 100).toFixed(0)}%
                </span>
              </motion.div>
            );
          })}
        </div>

        <StepLabel label="Relevance Scoring + Agent Selection" visible={active} />
      </motion.div>
    </div>
  );
};

export default StepDiscoveryNetwork;
