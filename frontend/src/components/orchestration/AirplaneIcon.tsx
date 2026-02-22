import { motion } from "framer-motion";

interface AirplaneIconProps {
  visible: boolean;
}

const AirplaneIcon = ({ visible }: AirplaneIconProps) => {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
      }}
      className="relative z-10"
    >
      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center glow-primary border border-primary/20">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
          <path
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="currentColor"
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default AirplaneIcon;
