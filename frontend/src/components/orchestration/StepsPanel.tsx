import { motion } from "framer-motion";
import { STEP_LABELS, type OrchestrationStep } from "@/hooks/useOrchestration";

interface Props {
  currentStep: OrchestrationStep;
  isComplete: boolean;
}

const STEPS = [
  { num: 1, label: "Local Agent → Search Engine", icon: "↗" },
  { num: 2, label: "Search Engine → Agent Manifest", icon: "⬡" },
  { num: 3, label: "Search Engine → Local Agent", icon: "↙" },
  { num: 4, label: "Local Agent → Agent Network", icon: "→" },
  { num: 5, label: "Agent Network → Local Agent", icon: "←" },
];

const StepsPanel = ({ currentStep, isComplete }: Props) => {
  return (
    <div className="h-full flex flex-col rounded-lg border border-border/50 overflow-hidden glass-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted-foreground">
          Workflow Steps
        </h2>
      </div>

      {/* Steps list */}
      <div className="flex-1 flex flex-col gap-1 p-3">
        {STEPS.map(({ num, label, icon }) => {
          const isActive = currentStep === num;
          const isDone = currentStep > num || isComplete;
          const isPending = currentStep < num && !isComplete;

          return (
            <motion.div
              key={num}
              className={`relative flex items-start gap-3 px-3 py-3 rounded-md font-mono text-xs transition-colors ${
                isActive
                  ? "bg-primary/10 border border-primary/30"
                  : isDone
                  ? "bg-muted/20 border border-border/20"
                  : "border border-transparent"
              }`}
              animate={{
                opacity: isPending ? 0.4 : 1,
              }}
            >
              {/* Step number indicator */}
              <div className="relative flex-shrink-0 mt-0.5">
                <motion.div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? "bg-primary/30 text-primary border border-primary/50"
                      : isDone
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "bg-muted/30 text-muted-foreground border border-border/30"
                  }`}
                  animate={
                    isActive
                      ? {
                          boxShadow: [
                            "0 0 0px rgba(96,165,250,0)",
                            "0 0 12px rgba(96,165,250,0.4)",
                            "0 0 0px rgba(96,165,250,0)",
                          ],
                        }
                      : {
                          boxShadow: "0 0 0px rgba(96,165,250,0)",
                        }
                  }
                  transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                >
                  {isDone ? "✓" : num}
                </motion.div>
                {/* Connecting line */}
                {num < 5 && (
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 w-px h-4 bg-border/30" />
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className={`leading-tight ${
                    isActive
                      ? "text-primary"
                      : isDone
                      ? "text-accent/80"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[10px] text-primary/60"
                  >
                    executing...
                  </motion.span>
                )}
                {isDone && (
                  <span className="text-[10px] text-accent/50">complete</span>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Final status */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-3 py-2.5 rounded-md bg-accent/10 border border-accent/30 text-center"
          >
            <span className="text-xs font-mono text-accent font-semibold">
              ✦ Execution Ready
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StepsPanel;
