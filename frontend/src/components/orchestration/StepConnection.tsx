import { motion } from "framer-motion";
import StepLabel from "./StepLabel";

interface StepConnectionProps {
  active: boolean;
  selectedAgent: string;
}

const StepConnection = ({ active, selectedAgent }: StepConnectionProps) => {
  if (!active) return null;

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl border border-border/50 glass-surface p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Local Agent */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                <span className="text-[10px] font-mono text-foreground/80">Local</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Local Agent</span>
            </div>

            {/* Connection line */}
            <div className="flex-1 relative h-8 flex items-center">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute inset-0 flex items-center origin-left"
              >
                <div className="w-full h-px bg-gradient-to-r from-primary via-connection-green to-primary" />
              </motion.div>

              {/* Animated data packet */}
              <motion.div
                initial={{ x: "0%", opacity: 0 }}
                animate={{ x: ["0%", "100%", "0%"], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2, delay: 0.8, repeat: 1 }}
                className="absolute w-2 h-2 rounded-full bg-primary glow-primary"
              />
            </div>

            {/* Selected Agent */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 10px hsl(210 100% 60% / 0.2)",
                    "0 0 20px hsl(210 100% 60% / 0.4)",
                    "0 0 10px hsl(210 100% 60% / 0.2)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center"
              >
                <span className="text-[9px] font-mono text-primary">
                  {selectedAgent.split(" ")[0]}
                </span>
              </motion.div>
              <span className="text-[10px] text-muted-foreground">{selectedAgent}</span>
            </div>
          </div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 flex justify-center"
          >
            <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-connection-green/15 text-connection-green border border-connection-green/30">
              ● Connection Established
            </span>
          </motion.div>
        </div>

        <StepLabel label="Bidirectional Link Active" visible={active} />
      </motion.div>
    </div>
  );
};

export default StepConnection;
