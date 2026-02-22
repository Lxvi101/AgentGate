import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import StepLabel from "./StepLabel";

interface StepTelegramProps {
  active: boolean;
  onSend: () => void;
  messageSent: boolean;
}

const StepTelegram = ({ active, onSend, messageSent }: StepTelegramProps) => {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Chat window */}
        <div className="rounded-xl border border-border/50 glass-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-telegram/20 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-telegram" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Telegram</p>
              <p className="text-[10px] text-muted-foreground">AI Agent Interface</p>
            </div>
          </div>

          <div className="p-4 min-h-[120px] flex flex-col justify-end gap-3">
            <AnimatePresence>
              {messageSent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="self-end"
                >
                  <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-telegram/20 border border-telegram/30 max-w-[280px]">
                    <p className="text-sm text-foreground">Book a flight to Milan from Paris.</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">Sent ✓</p>
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/30">
                    <p className="text-sm text-muted-foreground">Book a flight to Milan from Paris.</p>
                  </div>
                  <button
                    onClick={onSend}
                    className="p-2.5 rounded-xl bg-telegram/20 border border-telegram/30 text-telegram hover:bg-telegram/30 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Function call indicator */}
        <AnimatePresence>
          {messageSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-center"
            >
              <code className="text-xs font-mono text-text-code bg-muted/30 px-3 py-1 rounded-md border border-border/30">
                sendTelegramMessage()
              </code>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <StepLabel label="User Request Sent via Telegram" visible={messageSent} />
    </div>
  );
};

export default StepTelegram;
