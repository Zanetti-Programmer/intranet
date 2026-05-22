"use client";
import { Megaphone, AlertTriangle } from "lucide-react";
import type { Announcement } from "@/types";
import { formatDistanceToNow } from "@/lib/utils";

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-400",
  high:   "text-amber-400",
  normal: "text-blue-400",
};

export function AnnouncementsWidget({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Avisos Importantes</h3>
      </div>
      <div className="divide-y divide-border">
        {announcements.slice(0, 4).map((a) => (
          <div key={a.id} className="px-4 py-3 space-y-1">
            <div className="flex items-start gap-1.5">
              {a.priority === "urgent" && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />}
              <p className={`text-xs font-semibold leading-snug ${PRIORITY_COLOR[a.priority] ?? PRIORITY_COLOR.normal}`}>
                {a.title}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{a.content}</p>
            <p className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(a.created)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
