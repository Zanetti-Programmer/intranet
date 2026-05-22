"use client";
import { Bell, Info } from "lucide-react";
import type { Announcement } from "@/types";
import Link from "next/link";

export function AnnouncementsWidget({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header — Newsletter style */}
      <div className="px-5 pt-6 pb-5 text-center border-b border-border/60">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Avisos</h3>
        <p className="text-xs text-muted-foreground mt-1">Fique por dentro do que acontece</p>
      </div>

      {/* Announcements list */}
      {announcements.length > 0 ? (
        <div className="divide-y divide-border/50">
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} className="px-5 py-3.5 space-y-0.5">
              <p className={`text-xs font-semibold leading-snug ${
                a.priority === "urgent" ? "text-red-400" :
                a.priority === "high" ? "text-amber-400" : "text-foreground"
              }`}>
                {a.priority === "urgent" && "🔴 "}{a.title}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{a.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-xs text-muted-foreground">Sem avisos no momento</p>
        </div>
      )}

      {/* Footer link */}
      <div className="px-5 py-3 border-t border-border/60">
        <Link href="/avisos" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Info className="w-3.5 h-3.5" />
          <span>Ver todos os avisos</span>
        </Link>
      </div>
    </div>
  );
}
