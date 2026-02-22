import { motion } from "framer-motion";

interface DottedConnectorProps {
  active: boolean;
  height?: number;
}

const DottedConnector = ({ active, height = 100 }: DottedConnectorProps) => {
  const midX = 20;
  const curveAmp = 18;
  const path = `M ${midX} 0 C ${midX + curveAmp} ${height * 0.25}, ${midX - curveAmp} ${height * 0.75}, ${midX} ${height}`;

  return (
    <div className="flex justify-center" style={{ height }}>
      <svg width="40" height={height} className="overflow-visible">
        {/* Background faint path */}
        <path
          d={path}
          fill="none"
          stroke="hsl(var(--path-dot))"
          strokeWidth="1.5"
          strokeDasharray="5 8"
          opacity={0.3}
        />
        {/* Animated active path */}
        <motion.path
          d={path}
          fill="none"
          stroke={active ? "hsl(var(--primary))" : "transparent"}
          strokeWidth="1.5"
          strokeDasharray="5 8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 0.7 } : {}}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};

export default DottedConnector;
