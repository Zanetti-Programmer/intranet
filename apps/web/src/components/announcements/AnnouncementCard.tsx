"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgente", cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
  high:   { label: "Alta",    cls: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
  normal: { label: "Normal",  cls: "bg-muted text-muted-foreground border border-border" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Geral:     "bg-blue-500/15 text-blue-400",
  RH:        "bg-pink-500/15 text-pink-400",
  TI:        "bg-indigo-500/15 text-indigo-400",
  Comercial: "bg-emerald-500/15 text-emerald-400",
  Outros:    "bg-muted text-muted-foreground",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface Props {
  announcement: Announcement & { category?: string };
  index: number;
}

export function AnnouncementCard({ announcement: a, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_BADGE[a.priority] ?? PRIORITY_BADGE.normal;
  const author = a.expand?.author;
  const isLong = a.content.length > 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-border/60 transition-colors",
        a.pinned && "border-primary/30 bg-primary/5"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {a.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", priority.cls)}>
            {priority.label}
          </span>
          {a.category && (
            <span className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full",
              CATEGORY_COLORS[a.category] ?? "bg-muted text-muted-foreground"
            )}>
              {a.category}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.created)}</span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm leading-snug">{a.title}</h3>

      {/* Body */}
      <p className={cn(
        "text-sm text-muted-foreground leading-relaxed whitespace-pre-line",
        !expanded && isLong && "line-clamp-3"
      )}>
        {a.content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}

      {/* Footer */}
      {author && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <UserAvatar user={author} size="sm" />
          <span className="text-xs text-muted-foreground">{author.name}</span>
        </div>
      )}
    </motion.div>
  );
}
