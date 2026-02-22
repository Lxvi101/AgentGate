import { motion } from "framer-motion";

interface StepLabelProps {
  label: string;
  visible: boolean;
}

const StepLabel = ({ label, visible }: StepLabelProps) => {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-6 text-center"
    >
      <span className="px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase text-muted-foreground border border-border/50 bg-muted/30">
        {label}
      </span>
    </motion.div>
  );
};

export default StepLabel;
