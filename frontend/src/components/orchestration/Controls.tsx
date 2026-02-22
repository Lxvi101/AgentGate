import { Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

interface ControlsProps {
  isRunning: boolean;
  isComplete: boolean;
  soundEnabled: boolean;
  onStart: () => void;
  onReplay: () => void;
  onToggleSound: () => void;
}

const Controls = ({ isRunning, isComplete, soundEnabled, onStart, onReplay, onToggleSound }: ControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-6 right-6 z-50 flex items-center gap-3"
    >
      {!isRunning && !isComplete && (
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass-surface text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <Play className="w-4 h-4" />
          Start Process
        </button>
      )}
      {(isComplete || isRunning) && (
        <button
          onClick={onReplay}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass-surface text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>
      )}
      <button
        onClick={onToggleSound}
        className="p-2 rounded-lg glass-surface text-muted-foreground hover:text-foreground transition-colors"
        title={soundEnabled ? "Mute" : "Unmute"}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </motion.div>
  );
};

export default Controls;
