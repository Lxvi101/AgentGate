import { motion } from "framer-motion";

interface Props {
  active: boolean;
  glowing: boolean;
}

const SearchEngineFigure = ({ active, glowing }: Props) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="relative"
        animate={{
          y: active ? [0, -4, 0] : 0,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
          {/* Geometric totem: diamond head + stacked shapes */}
          <motion.g
            animate={{
              filter: glowing
                ? "drop-shadow(0 0 12px hsl(210 100% 60% / 0.6))"
                : "drop-shadow(0 0 4px hsl(210 100% 60% / 0.15))",
            }}
            transition={{ duration: 0.6 }}
          >
            {/* Head - diamond */}
            <motion.polygon
              points="40,8 56,28 40,38 24,28"
              fill="hsl(210 100% 60% / 0.15)"
              stroke="hsl(210 100% 60% / 0.7)"
              strokeWidth="1.5"
              animate={{ fill: glowing ? "hsl(210 100% 60% / 0.35)" : "hsl(210 100% 60% / 0.15)" }}
            />
            {/* Core eye */}
            <circle
              cx="40"
              cy="26"
              r={glowing ? 5 : 4}
              fill={glowing ? "hsl(210 100% 70% / 1)" : "hsl(210 100% 60% / 0.8)"}
              style={{ transition: "r 0.3s, fill 0.3s" }}
            />
            {/* Body - trapezoid */}
            <motion.polygon
              points="30,42 50,42 56,72 24,72"
              fill="hsl(210 100% 60% / 0.1)"
              stroke="hsl(210 100% 60% / 0.5)"
              strokeWidth="1"
              animate={{ fill: glowing ? "hsl(210 100% 60% / 0.25)" : "hsl(210 100% 60% / 0.1)" }}
            />
            {/* Base line */}
            <line x1="20" y1="76" x2="60" y2="76" stroke="hsl(210 100% 60% / 0.4)" strokeWidth="2" />
            {/* Scan lines inside body */}
            <motion.line
              x1="34" y1="52" x2="46" y2="52"
              stroke="hsl(210 100% 60% / 0.4)" strokeWidth="1"
              animate={{ opacity: glowing ? [0.3, 0.8, 0.3] : 0.3 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.line
              x1="32" y1="58" x2="48" y2="58"
              stroke="hsl(210 100% 60% / 0.4)" strokeWidth="1"
              animate={{ opacity: glowing ? [0.5, 0.3, 0.5] : 0.3 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.line
              x1="30" y1="64" x2="50" y2="64"
              stroke="hsl(210 100% 60% / 0.4)" strokeWidth="1"
              animate={{ opacity: glowing ? [0.3, 0.6, 0.3] : 0.3 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            />
          </motion.g>
        </svg>
      </motion.div>
      <span className="text-xs font-mono tracking-wider uppercase text-muted-foreground">
        Search Engine
      </span>
    </div>
  );
};

export default SearchEngineFigure;
