import { motion } from "framer-motion";
import { AGENT_MANIFEST, type AgentCard } from "@/hooks/useOrchestration";

interface Props {
  visible: boolean;
  readingIndex: number;
  flippedIndices: number[];
  shortlistPhase: boolean;
  shortlistedIndices: number[];
}

const CardFront = ({ card, isReading }: { card: AgentCard; isReading: boolean }) => (
  <div
    className={`relative w-full h-full rounded-md border px-2.5 py-2 flex flex-col gap-1 overflow-hidden font-mono transition-colors ${
      isReading
        ? "border-primary/60 bg-primary/10"
        : "border-border/40 bg-card/80"
    }`}
  >
    <div className="text-[10px] font-semibold text-foreground truncate">{card.name}</div>
    <div className="text-[8px] text-muted-foreground">{card.provider}</div>
    <div className="flex flex-wrap gap-0.5 mt-auto">
      {card.capabilities.slice(0, 2).map((c) => (
        <span
          key={c}
          className="text-[7px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground truncate"
        >
          {c}
        </span>
      ))}
    </div>
  </div>
);

const CardBack = ({ card }: { card: AgentCard }) => (
  <div className="w-full h-full rounded-md border border-accent/40 bg-accent/5 px-2.5 py-2 flex flex-col gap-1 font-mono">
    <div className="text-[10px] font-semibold text-accent truncate">{card.name}</div>
    <div className="text-[8px] text-foreground/70 line-clamp-2">{card.description}</div>
    <div className="mt-auto flex items-center justify-between">
      <span className="text-[8px] text-muted-foreground">score</span>
      <span className="text-[10px] font-bold text-accent">{card.score.toFixed(2)}</span>
    </div>
  </div>
);

const AgentManifestCards = ({ visible, readingIndex, flippedIndices, shortlistPhase, shortlistedIndices }: Props) => {
  if (!visible) return null;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex gap-2 justify-center flex-wrap"
      >
        {AGENT_MANIFEST.map((card, i) => {
          const isFlipped = flippedIndices.includes(i);
          const isReading = readingIndex === i;
          const isShortlisted = shortlistedIndices.includes(i);

          // Compute animation target
          let animTarget: { x: number; y: number; opacity: number; scale: number };
          if (shortlistPhase && isShortlisted) {
            // Fly toward Local Agent (bottom-left)
            animTarget = {
              x: -180 - i * 20,
              y: 280,
              opacity: 0,
              scale: 0.3,
            };
          } else if (shortlistPhase && !isShortlisted) {
            // Fade and shrink in place
            animTarget = { x: 0, y: 0, opacity: 0.15, scale: 0.85 };
          } else {
            animTarget = { x: 0, y: 0, opacity: 1, scale: 1 };
          }

          return (
            <motion.div
              key={card.name}
              className="relative w-[120px] h-[80px]"
              style={{ perspective: 600 }}
              initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
              animate={{
                opacity: animTarget.opacity,
                scale: animTarget.scale,
                x: animTarget.x,
                y: animTarget.y,
              }}
              transition={
                shortlistPhase
                  ? { duration: 1.2, delay: 0, ease: "easeInOut" }
                  : { delay: i * 0.08, duration: 0.3 }
              }
            >
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <CardFront card={card} isReading={isReading} />
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <CardBack card={card} />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default AgentManifestCards;
