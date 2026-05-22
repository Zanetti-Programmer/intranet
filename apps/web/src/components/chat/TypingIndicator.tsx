"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";

export function TypingIndicator({ users }: { users: User[] }) {
  if (!users.length) return null;

  const label =
    users.length === 1
      ? `${users[0].name} está digitando`
      : users.length === 2
      ? `${users[0].name} e ${users[1].name} estão digitando`
      : "Várias pessoas estão digitando";

  return (
    <AnimatePresence>
      <motion.div
        key="typing"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground"
      >
        {/* Animated dots */}
        <span className="flex gap-0.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-muted-foreground"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
        <span>{label}...</span>
      </motion.div>
    </AnimatePresence>
  );
}
