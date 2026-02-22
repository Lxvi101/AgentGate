import { motion } from "framer-motion";
import JsonBlock from "./JsonBlock";
import StepLabel from "./StepLabel";

interface StepLocalAgentProps {
  active: boolean;
}

const intentData = {
  intent: "generate_research_plan",
  domain: "travel",
  constraints: {
    origin: "Paris (CDG)",
    destination: "Milan (MXP)",
    type: "one_way",
    class: "economy",
  },
};

const StepLocalAgent = ({ active }: StepLocalAgentProps) => {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {active && (
          <>
            <div className="rounded-xl border border-border/50 glass-surface p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
                <h3 className="text-sm font-semibold text-foreground tracking-wide">
                  Local Agent
                </h3>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-muted-foreground mb-4"
              >
                Converting natural language → structured intent...
              </motion.p>

              <JsonBlock data={intentData} visible={active} delay={0.5} />
            </div>

            <StepLabel label="Local Agent → Structured Intent" visible={active} />
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StepLocalAgent;
