"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/lib/hooks/useEvents";

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["S","T","Q","Q","S","S","D"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days: { date: Date; current: boolean }[] = [];
  for (let i = startDow; i > 0; i--)
    days.push({ date: new Date(year, month, 1 - i), current: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), current: true });
  const endDow = (lastDay.getDay() + 6) % 7;
  for (let i = 1; i <= 6 - endDow; i++)
    days.push({ date: new Date(year, month + 1, i), current: false });
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

export function MiniCalendarWidget() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { events } = useEvents();

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const days = getCalendarDays(year, month);

  // Map day → events for this month
  const eventsByDay = useMemo(() => {
    const map = new Map<string, { color: string }[]>();
    events.forEach((ev) => {
      const d = new Date(ev.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ color: ev.color ?? "#3b82f6" });
    });
    return map;
  }, [events]);

  // Next 3 upcoming events
  const upcoming = useMemo(() =>
    events
      .filter((ev) => new Date(ev.start) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3)
  , [events]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="w-full h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-muted relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">📅</div>
        <div className="absolute bottom-3 left-4">
          <p className="text-xs text-muted-foreground font-medium">Calendário</p>
          <p className="text-sm font-bold">{MONTHS_PT[now.getMonth()]} {now.getFullYear()}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prev} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-bold">{MONTHS_PT[month]} {year}</h4>
          <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAYS_PT.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground py-0.5">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
            const dayEvents = eventsByDay.get(key) ?? [];
            const isToday = isSameDay(day.date, now);
            const hasEvents = dayEvents.length > 0;

            return (
              <button key={i} onClick={() => router.push("/calendario")}
                className={cn(
                  "flex flex-col items-center justify-center h-8 rounded-lg text-xs transition-colors relative",
                  !day.current && "text-muted-foreground/30 pointer-events-none",
                  day.current && !isToday && "text-foreground/80 hover:bg-muted",
                  isToday && "bg-primary text-primary-foreground font-bold",
                )}>
                {day.date.getDate()}
                {hasEvents && day.current && (
                  <div className="flex gap-0.5 absolute bottom-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <span key={j} className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isToday ? "white" : ev.color }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div className="border-t border-border/60 pt-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Próximos eventos</p>
            {upcoming.map((ev) => {
              const d = new Date(ev.start);
              const isToday = isSameDay(d, now);
              const isTomorrow = isSameDay(d, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
              const dayLabel = isToday ? "Hoje" : isTomorrow ? "Amanhã"
                : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

              return (
                <button key={ev.id} onClick={() => router.push("/calendario")}
                  className="w-full flex items-center gap-2 text-left hover:bg-muted/40 rounded-lg px-1 py-1 transition-colors group">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color ?? "#3b82f6" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock style={{ width: 9, height: 9 }} />
                      {dayLabel}{!ev.all_day && ` · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Link */}
        <button onClick={() => router.push("/calendario")}
          className="w-full text-[11px] text-muted-foreground hover:text-primary transition-colors text-center pt-1">
          Ver calendário completo →
        </button>
      </div>
    </div>
  );
}
