"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useReactions } from "@/lib/hooks/usePosts";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "😄", "😮", "🎉", "🔥"];

export function ReactionBar({ postId }: { postId: string }) {
  const { reactions, toggle } = useReactions(postId);
  const myId = getPocketBase().authStore.record?.id;

  // Group reactions by emoji
  const grouped = EMOJIS.map((emoji) => {
    const list = reactions.filter((r) => r.emoji === emoji);
    return { emoji, count: list.length, mine: list.some((r) => r.user === myId) };
  }).filter((g) => g.count > 0 || false);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <AnimatePresence>
        {grouped.map(({ emoji, count, mine }) => (
          <motion.button
            key={emoji}
            layout
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => toggle(emoji)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
              mine
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-muted border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            <span>{emoji}</span>
            <motion.span key={count} initial={{ y: -6 }} animate={{ y: 0 }} className="tabular-nums">
              {count}
            </motion.span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Picker */}
      <div className="relative group">
        <button className="px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 text-sm transition-colors">
          +
        </button>
        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex gap-1 bg-card border border-border rounded-xl p-1.5 shadow-xl z-10">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => toggle(e)}
              className="text-base hover:scale-125 transition-transform p-0.5"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
