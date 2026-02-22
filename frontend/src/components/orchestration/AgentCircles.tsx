import { motion } from "framer-motion";
import { AGENT_MANIFEST } from "@/hooks/useOrchestration";

interface Props {
  visible: boolean;
  selectedAgent: string;
  currentStep: number;
}

// Positions centred in a local 120x120 viewBox
export const AGENT_CIRCLE_POSITIONS = [
  { x: 40, y: -10 },
  { x: 80, y: -10 },
  { x: 25, y: 20 },
  { x: 95, y: 20 },
  { x: 40, y: 50 },
  { x: 80, y: 50 },
];

const AgentCircles = ({ visible, selectedAgent, currentStep }: Props) => {
  if (!visible) return null;

  return (
    <g>
      {AGENT_MANIFEST.map((agent, i) => {
        const pos = AGENT_CIRCLE_POSITIONS[i];
        const isSelected = agent.name === selectedAgent && currentStep >= 4;
        const radius = 10 + agent.score * 8;

        return (
          <motion.g
            key={agent.name}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              y: [0, -3, 0, 2, 0],
            }}
            transition={{
              opacity: { delay: i * 0.1, duration: 0.4 },
              y: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius}
              fill={
                isSelected
                  ? "hsl(150 70% 50% / 0.25)"
                  : "hsl(260 60% 60% / 0.1)"
              }
              stroke={
                isSelected
                  ? "hsl(150 70% 50% / 0.8)"
                  : "hsl(260 60% 60% / 0.4)"
              }
              strokeWidth={isSelected ? 2 : 1}
              style={{
                filter: isSelected
                  ? "drop-shadow(0 0 10px hsl(150 70% 50% / 0.5))"
                  : "none",
                transition: "filter 0.4s, fill 0.4s, stroke 0.4s",
              }}
            />
            {/* Agent name */}
            <motion.text
              x={pos.x}
              y={pos.y + 2}
              textAnchor="middle"
              fill={
                isSelected
                  ? "hsl(150 70% 70%)"
                  : "hsl(220 15% 55%)"
              }
              fontSize="7"
              fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.3 }}
            >
              {agent.name.replace("Agent", "")}
            </motion.text>
            {/* Pulse ring when selected */}
            {isSelected && (
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                fill="none"
                stroke="hsl(150 70% 50% / 0.4)"
                strokeWidth="1"
                initial={{ r: radius, opacity: 0.6 }}
                animate={{
                  r: [radius, radius + 8, radius + 16],
                  opacity: [0.6, 0.2, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.g>
        );
      })}
    </g>
  );
};

export default AgentCircles;
