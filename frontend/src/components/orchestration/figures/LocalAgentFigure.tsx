import { motion } from "framer-motion";

interface Props {
  active: boolean;
  glowing: boolean;
  executionReady: boolean;
}

const LocalAgentFigure = ({ active, glowing, executionReady }: Props) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="relative"
        animate={{
          y: active ? [0, -3, 0, -2, 0] : 0,
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
          <motion.g
            animate={{
              filter: glowing
                ? "drop-shadow(0 0 14px hsl(180 80% 55% / 0.6))"
                : "drop-shadow(0 0 4px hsl(180 80% 55% / 0.15))",
            }}
            transition={{ duration: 0.6 }}
          >
            {/* Head - hexagon */}
            <motion.polygon
              points="40,6 54,16 54,32 40,42 26,32 26,16"
              fill="hsl(180 80% 55% / 0.12)"
              stroke="hsl(180 80% 55% / 0.7)"
              strokeWidth="1.5"
              animate={{ fill: glowing ? "hsl(180 80% 55% / 0.3)" : "hsl(180 80% 55% / 0.12)" }}
            />
            {/* Inner triangle */}
            <motion.polygon
              points="40,16 48,28 32,28"
              fill="hsl(180 80% 55% / 0.6)"
              animate={{
                fill: glowing ? "hsl(180 80% 65% / 0.9)" : "hsl(180 80% 55% / 0.6)",
              }}
            />
            {/* Body - tapered rectangle */}
            <motion.path
              d="M32,46 L48,46 L52,78 L28,78 Z"
              fill="hsl(180 80% 55% / 0.08)"
              stroke="hsl(180 80% 55% / 0.5)"
              strokeWidth="1"
              animate={{ fill: glowing ? "hsl(180 80% 55% / 0.2)" : "hsl(180 80% 55% / 0.08)" }}
            />
            {/* Pulse rings when active */}
            {glowing && (
              <>
                <motion.circle
                  cx="40"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="hsl(180 80% 55% / 0.4)"
                  strokeWidth="1"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </>
            )}
            {/* Base */}
            <line x1="24" y1="82" x2="56" y2="82" stroke="hsl(180 80% 55% / 0.4)" strokeWidth="2" />
          </motion.g>
        </svg>
        {/* Execution Ready badge */}
        {executionReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono bg-accent/20 text-accent border border-accent/30 whitespace-nowrap"
          >
            Execution Ready
          </motion.div>
        )}
      </motion.div>
      <span className="text-xs font-mono tracking-wider uppercase text-muted-foreground mt-1">
        Local Agent
      </span>
    </div>
  );
};

export default LocalAgentFigure;
