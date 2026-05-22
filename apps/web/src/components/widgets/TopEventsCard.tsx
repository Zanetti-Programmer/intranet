"use client";
import { useEffect, useState } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { CalendarEvent } from "@/lib/hooks/useEvents";
import Link from "next/link";

const MONTH_SHORT = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

export function TopEventsCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    const now = new Date().toISOString();
    pb.collection("events").getList(1, 3, {
      sort: "start",
      filter: `start >= "${now}"`,
    }).then((r) => setEvents(r.items as unknown as CalendarEvent[]))
      .catch(() => {});
  }, []);

  // If no real events, show placeholder data
  const displayEvents = events.length > 0 ? events : [
    { id: "1", title: "Reunião de Planejamento", start: new Date(Date.now() + 86400000 * 3).toISOString(), description: "Planejamento Q3" } as CalendarEvent,
    { id: "2", title: "Treinamento de TI",        start: new Date(Date.now() + 86400000 * 12).toISOString(), description: "Segurança da informação" } as CalendarEvent,
    { id: "3", title: "Evento da Empresa",          start: new Date(Date.now() + 86400000 * 22).toISOString(), description: "Confraternização" } as CalendarEvent,
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Top Events</h3>
      </div>
      <div className="border-t border-border/60" />

      <div className="divide-y divide-border/50">
        {displayEvents.map((ev) => {
          const date = new Date(ev.start);
          const day = date.getDate();
          const month = MONTH_SHORT[date.getMonth()];
          return (
            <div key={ev.id} className="flex items-center gap-4 px-5 py-4">
              {/* Date block */}
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-muted shrink-0 border border-border">
                <span className="text-base font-bold leading-none">{day}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">{ev.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {date.toLocaleDateString("pt-BR", { month: "long", day: "numeric" })} · {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/60">
        <Link href="/calendario"
          className="w-full flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          VIEW ALL <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">→</span>
        </Link>
      </div>
    </div>
  );
}
