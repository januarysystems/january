import { motion } from "framer-motion";
import { ArrowUp, Code2, FileText, ImageIcon, Mic, Paperclip } from "lucide-react";

export function PromptBar({
  placeholder = "Ask January anything...",
}: {
  placeholder?: string;
}) {
  return (
    <div className="glass-panel flex items-end gap-3 rounded-2xl px-3 py-3">
      <div className="min-w-0 flex-1">
        <textarea
          rows={1}
          placeholder={placeholder}
          className="max-h-32 w-full resize-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          {[Paperclip, ImageIcon, Code2, FileText, Mic].map((Icon, i) => (
            <button
              key={i}
              aria-label="Attach"
              className="grid size-7 place-items-center rounded-md transition-colors hover:bg-accent/40 hover:text-amber"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-0.5">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Voice input"
          className="grid size-10 place-items-center rounded-full border border-amber/40 bg-secondary/50 text-amber"
        >
          <Mic className="size-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Send"
          className="amber-gradient glow-ring grid size-10 place-items-center rounded-full text-primary-foreground"
        >
          <ArrowUp className="size-4" />
        </motion.button>
      </div>
    </div>
  );
}