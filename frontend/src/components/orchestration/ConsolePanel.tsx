import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ConsoleEntry } from "@/hooks/useOrchestration";

interface Props {
  entries: ConsoleEntry[];
}

const syntaxHighlight = (json: string): string => {
  return json
    .replace(/(".*?")\s*:/g, '<span class="text-primary">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span style="color: hsl(150 70% 60%)">$1</span>')
    .replace(/:\s*([\d.]+)/g, ': <span style="color: hsl(30 90% 65%)">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span style="color: hsl(280 70% 70%)">$1</span>');
};

const ConsolePanel = ({ entries }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="h-full flex flex-col rounded-lg border border-border/50 overflow-hidden" style={{ background: "hsl(230 40% 10% / 0.95)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(45 90% 50% / 0.6)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(150 70% 50% / 0.6)" }} />
        </div>
        <span className="text-xs font-mono text-muted-foreground ml-2">network-console</span>
      </div>

      {/* Entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs leading-relaxed" style={{ color: "hsl(220 20% 90%)" }}>
        {entries.length === 0 && (
          <div className="text-muted-foreground/50 text-center py-8 text-xs">
            Awaiting orchestration...
          </div>
        )}
        {entries.map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              className="border-l-2 border-primary/30 pl-3 animate-fade-in"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-muted-foreground/60">{entry.timestamp}</span>
                <span className="text-primary text-[11px]">{entry.label}</span>
              </div>
              <pre
                className="whitespace-pre-wrap break-all"
                style={{ color: "hsl(220 20% 85%)" }}
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(JSON.stringify(entry.payload, null, 2)),
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default ConsolePanel;
