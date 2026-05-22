"use client";
import Link from "next/link";
import { Bell, Info } from "lucide-react";
import type { Announcement } from "@/types";

export function AnnouncementsWidget({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header — Newsletter style com ícone grande */}
      <div className="px-6 pt-7 pb-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5 border border-border">
          <Bell className="w-8 h-8 text-foreground/70" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight leading-none">Newsletter</h2>
        <p className="text-sm text-muted-foreground mt-2">Check Latest Updates</p>
      </div>

      {/* Input style (like the email field in Alliance) */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-muted/30">
          <input
            type="email"
            placeholder="YOUR EMAIL"
            className="flex-1 h-10 bg-transparent px-4 text-xs placeholder:text-muted-foreground/50 focus:outline-none tracking-wider uppercase"
          />
          <button className="w-10 h-10 bg-foreground text-background flex items-center justify-center shrink-0 hover:bg-foreground/80 transition-colors">
            <span className="text-base leading-none">→</span>
          </button>
        </div>
      </div>

      {/* Announcements */}
      {announcements.slice(0, 2).map((a) => (
        <div key={a.id} className="px-6 pb-3 flex items-start gap-2">
          <span className={`text-xs font-semibold ${a.priority === "urgent" ? "text-red-400" : a.priority === "high" ? "text-amber-400" : "text-muted-foreground"}`}>
            {a.title}
          </span>
        </div>
      ))}

      {/* Footer */}
      <div className="px-6 pb-5">
        <Link href="/avisos" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Info className="w-3.5 h-3.5" />
          <span>Important Notification</span>
        </Link>
      </div>
    </div>
  );
}
