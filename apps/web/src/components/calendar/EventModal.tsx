"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CalendarEvent } from "@/lib/hooks/useEvents";
import type { Space } from "@/types";
import { formatDistanceToNow } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

// ── View mode (clicking an existing event) ─────────────────────────────────────
interface ViewProps {
  events: CalendarEvent[];
  date: Date;
  spaces: Space[];
  onDelete: (id: string) => void;
  onClose: () => void;
  onNew: () => void;
}

export function DayEventsPanel({ events, date, spaces, onDelete, onClose, onNew }: ViewProps) {
  const myId = getPocketBase().authStore.record?.id;
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h3 className="font-semibold">{events.length} evento{events.length !== 1 ? "s" : ""}</h3>
        </div>
        <Button size="sm" onClick={onNew} className="h-8 px-3 text-xs gap-1.5">
          + Novo evento
        </Button>
      </div>
      <div className="space-y-2">
        {events.map((ev) => {
          const space = spaces.find((s) => s.id === ev.space);
          return (
            <div key={ev.id}
              style={{ borderLeft: `3px solid ${ev.color ?? "#3b82f6"}` }}
              className="bg-muted rounded-r-lg px-3 py-2.5 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ev.title}</p>
                {ev.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.description}</p>}
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {ev.all_day ? "Dia todo" : new Date(ev.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {space && <span style={{ color: space.color }}>{space.icon} {space.name}</span>}
                </div>
              </div>
              {ev.author === myId && (
                <button onClick={() => onDelete(ev.id)} className="text-muted-foreground hover:text-destructive p-1 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

// ── Create mode ────────────────────────────────────────────────────────────────
interface CreateProps {
  initialDate?: Date;
  spaces: Space[];
  onCreate: (data: Omit<CalendarEvent, "id" | "author" | "expand">) => Promise<void>;
  onClose: () => void;
}

export function CreateEventModal({ initialDate, spaces, onCreate, onClose }: CreateProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(initialDate
    ? initialDate.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [spaceId, setSpaceId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const start = allDay ? `${date} 00:00:00` : `${date} ${time}:00`;
      await onCreate({ title, description, start, all_day: allDay, color, space: spaceId || undefined });
      onClose();
    } finally { setLoading(false); }
  }

  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-semibold mb-4">Novo evento</h3>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião de equipe" className="mt-1 h-9" autoFocus />
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do evento..." className="mt-1 min-h-[60px] resize-none" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Data *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs">Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={allDay} className="mt-1 h-9" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="allday" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
          <label htmlFor="allday" className="text-sm">Dia todo</label>
        </div>
        <div>
          <Label className="text-xs">Espaço</Label>
          <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)}
            className="mt-1 w-full h-9 bg-background border border-input rounded-md text-sm px-3">
            <option value="">Nenhum</option>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-2 block">Cor</Label>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-1 ring-offset-background" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
        <Button onClick={handleCreate} disabled={!title.trim() || loading} className="flex-1 h-9">
          {loading ? "Salvando..." : "Criar evento"}
        </Button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl">
        {children}
      </motion.div>
    </div>
  );
}
