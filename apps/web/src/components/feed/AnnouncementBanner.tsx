"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, AlertTriangle, Info } from "lucide-react";
import type { Announcement } from "@/types";
import { useState } from "react";
import { formatDistanceToNow } from "@/lib/utils";

const PRIORITY_STYLES = {
  urgent: { bg: "bg-red-500/10 border-red-500/30",  text: "text-red-400",   icon: AlertTriangle, badge: "bg-red-500" },
  high:   { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", icon: Megaphone, badge: "bg-amber-500" },
  normal: { bg: "bg-blue-500/10 border-blue-500/30",  text: "text-blue-400",  icon: Info,      badge: "bg-blue-500" },
};

function AnnouncementItem({ a }: { a: Announcement }) {
  const [dismissed, setDismissed] = useState(false);
  const s = PRIORITY_STYLES[a.priority] ?? PRIORITY_STYLES.normal;
  const Icon = s.icon;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={`border rounded-xl px-4 py-3 flex gap-3 items-start ${s.bg}`}
        >
          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.text}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{a.title}</span>
              {a.priority !== "normal" && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium ${s.badge}`}>
                  {a.priority === "urgent" ? "URGENTE" : "IMPORTANTE"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              {a.expand?.author?.name} · {formatDistanceToNow(a.created)}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) return null;
  return (
    <div className="space-y-2">
      {announcements.map((a) => <AnnouncementItem key={a.id} a={a} />)}
    </div>
  );
}
