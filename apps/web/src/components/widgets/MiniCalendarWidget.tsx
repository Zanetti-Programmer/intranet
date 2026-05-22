"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["M","T","W","T","F","S","S"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const days: { date: number; current: boolean }[] = [];
  for (let i = startDow; i > 0; i--)
    days.push({ date: new Date(year, month, 1 - i).getDate(), current: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: d, current: true });
  let endDow = (lastDay.getDay() + 6) % 7;
  for (let i = 1; i <= 6 - endDow; i++)
    days.push({ date: i, current: false });
  return days;
}

export function MiniCalendarWidget() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prev() { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }
  function next() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }

  const days = getCalendarDays(year, month);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header image placeholder */}
      <div className="w-full h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">📅</div>
      </div>

      {/* Calendar */}
      <div className="p-4">
        {/* Month header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prev} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-bold">{MONTHS_PT[month]} {year}</h4>
          <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            const isToday = day.current && day.date === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            return (
              <div key={i} className={cn(
                "flex items-center justify-center h-7 text-xs rounded-lg cursor-pointer transition-colors",
                !day.current && "text-muted-foreground/30",
                day.current && !isToday && "text-foreground/80 hover:bg-muted",
                isToday && "bg-primary text-primary-foreground font-bold",
              )}>
                {day.date}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <ChevronLeft className="w-3 h-3" />
          <span>{MONTHS_PT[(month - 1 + 12) % 12].slice(0, 3)}</span>
        </div>
      </div>
    </div>
  );
}
