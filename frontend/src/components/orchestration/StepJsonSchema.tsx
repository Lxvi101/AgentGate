import { motion } from "framer-motion";
import JsonBlock from "./JsonBlock";
import StepLabel from "./StepLabel";

interface StepJsonSchemaProps {
  active: boolean;
}

const schemaData = {
  steps: [
    "search_flights",
    "compare_prices",
    "validate_availability",
    "generate_booking",
  ],
  parameters: {
    origin: "CDG",
    destination: "MXP",
    date_range: "flexible",
    budget: "optimized",
  },
  execution_plan: {
    parallel: true,
    retry_policy: "exponential_backoff",
    timeout_ms: 30000,
  },
};

const StepJsonSchema = ({ active }: StepJsonSchemaProps) => {
  if (!active) return null;

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Schema from agent */}
        <div className="rounded-xl border border-border/50 glass-surface p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
            <h3 className="text-sm font-semibold text-foreground tracking-wide">
              Research Agent Response
            </h3>
          </div>
          <JsonBlock data={schemaData} visible={active} delay={0.3} />
        </div>

        {/* Executor block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="rounded-xl border border-connection-green/30 bg-connection-green/5 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-connection-green animate-pulse-glow" />
            <h3 className="text-sm font-semibold text-foreground tracking-wide">
              Local MCP Executor
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Schema received. Execution plan validated.
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6 }}
            className="flex justify-center"
          >
            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-connection-green/15 text-connection-green border border-connection-green/30 glow-success">
              ✓ Solution Generated
            </span>
          </motion.div>
        </motion.div>

        <StepLabel label="Execution Complete" visible={active} />
      </motion.div>
    </div>
  );
};

export default StepJsonSchema;
