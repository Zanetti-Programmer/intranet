"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/hooks/useEvents";

const DAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const days: { date: Date; current: boolean }[] = [];
  for (let i = startDow; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), current: false });
  for (let d = 1; d <= lastDay.getDate(); d++) days.push({ date: new Date(year, month, d), current: true });
  let endDow = (lastDay.getDay() + 6) % 7;
  for (let i = 1; i <= 6 - endDow; i++) days.push({ date: new Date(year, month + 1, i), current: false });
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function eventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter((e) => {
    const start = new Date(e.start);
    return isSameDay(start, day);
  });
}

interface Props {
  events: CalendarEvent[];
  onDayClick: (date: Date, dayEvents: CalendarEvent[]) => void;
  onCreateClick: (date: Date) => void;
}

export function CalendarGrid({ events, onDayClick, onCreateClick }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const days = getCalendarDays(year, month);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold min-w-36 text-center">
            {MONTHS_PT[month]} {year}
          </h2>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
          Hoje
        </button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 flex-1 border border-border rounded-xl overflow-hidden">
        {days.map((day, i) => {
          const dayEvents = eventsForDay(events, day.date);
          const isToday = isSameDay(day.date, today);
          const isWeekend = [5, 6].includes(i % 7);

          return (
            <motion.div key={i} whileTap={{ scale: 0.97 }}
              onClick={() => dayEvents.length ? onDayClick(day.date, dayEvents) : onCreateClick(day.date)}
              className={cn(
                "group min-h-[80px] p-1.5 border-r border-b border-border cursor-pointer transition-colors",
                "hover:bg-muted/40",
                !day.current && "bg-muted/10",
                isWeekend && day.current && "bg-muted/20",
                i % 7 === 6 && "border-r-0",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isToday && "bg-primary text-primary-foreground",
                  !day.current && "text-muted-foreground/40",
                )}>
                  {day.date.getDate()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCreateClick(day.date); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/20 text-primary"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div key={ev.id}
                    style={{ backgroundColor: `${ev.color ?? "#3b82f6"}25`, borderLeft: `2px solid ${ev.color ?? "#3b82f6"}` }}
                    className="text-[10px] px-1 py-0.5 rounded-sm font-medium truncate"
                    onClick={(e) => { e.stopPropagation(); onDayClick(day.date, dayEvents); }}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3}</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
