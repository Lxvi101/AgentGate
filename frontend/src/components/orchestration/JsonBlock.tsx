import { motion } from "framer-motion";

interface JsonBlockProps {
  data: object;
  visible: boolean;
  delay?: number;
}

const JsonBlock = ({ data, visible, delay = 0 }: JsonBlockProps) => {
  if (!visible) return null;

  const lines = JSON.stringify(data, null, 2).split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-lg border border-border/50 bg-muted/40 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/30">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-connection-green/60" />
        <span className="ml-2 text-[10px] text-muted-foreground font-mono">output.json</span>
      </div>
      <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: delay + i * 0.05 }}
          >
            <span className="text-text-code">{line}</span>
          </motion.div>
        ))}
      </pre>
    </motion.div>
  );
};

export default JsonBlock;
