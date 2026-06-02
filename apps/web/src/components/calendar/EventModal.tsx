"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Trash2, Clock, Pencil, Globe, Lock, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { CalendarEvent } from "@/lib/hooks/useEvents";
import type { Space, User } from "@/types";
import { formatDistanceToNow, cn } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";
import { toast } from "sonner";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

const VISIBILITY_CFG = {
  publico:    { label: "Público",     desc: "Todos veem",                  icon: Globe,  cls: "text-blue-400"    },
  privado:    { label: "Privado",     desc: "Só você vê",                  icon: Lock,   cls: "text-muted-foreground" },
  convidados: { label: "Convidados",  desc: "Você + pessoas convidadas",   icon: Users,  cls: "text-emerald-400" },
} as const;

// ── Day events panel ───────────────────────────────────────────────────────────

interface PanelProps {
  events: CalendarEvent[];
  date: Date;
  spaces: Space[];
  onDelete: (id: string) => void;
  onEdit: (ev: CalendarEvent) => void;
  onClose: () => void;
  onNew: () => void;
}

export function DayEventsPanel({ events, date, spaces, onDelete, onEdit, onClose, onNew }: PanelProps) {
  const myId = getPocketBase().authStore.record?.id;

  return (
    <ModalShell onClose={onClose} size="sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground capitalize">
            {date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h3 className="font-semibold">{events.length} evento{events.length !== 1 ? "s" : ""}</h3>
        </div>
        <Button size="sm" onClick={onNew} className="h-8 px-3 text-xs gap-1">
          + Novo
        </Button>
      </div>

      <div className="space-y-2">
        {events.map((ev) => {
          const space = spaces.find((s) => s.id === ev.space);
          const vis = VISIBILITY_CFG[ev.visibility || "publico"];
          const VisIcon = vis.icon;
          const isOwner = ev.author === myId;
          const attendees = ev.expand?.attendees ?? [];

          return (
            <div key={ev.id}
              style={{ borderLeft: `3px solid ${ev.color ?? "#3b82f6"}` }}
              className="bg-muted rounded-r-lg px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ev.title}</p>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock style={{ width: 10, height: 10 }} />
                      {ev.all_day ? "Dia todo" : new Date(ev.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={cn("flex items-center gap-1", vis.cls)}>
                      <VisIcon style={{ width: 10, height: 10 }} /> {vis.label}
                    </span>
                    {space && <span style={{ color: space.color }}>{space.icon} {space.name}</span>}
                  </div>
                  {attendees.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">Convidados:</span>
                      <div className="flex -space-x-1">
                        {attendees.slice(0, 5).map((u) => (
                          <UserAvatar key={u.id} user={u} size="sm" className="ring-1 ring-card" />
                        ))}
                        {attendees.length > 5 && (
                          <span className="text-[10px] text-muted-foreground ml-1.5">+{attendees.length - 5}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => onEdit(ev)}
                      className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil style={{ width: 12, height: 12 }} />
                    </button>
                    <button onClick={() => onDelete(ev.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

// ── Unified create / edit modal ────────────────────────────────────────────────

interface EventModalProps {
  initialDate?: Date;
  initial?: CalendarEvent;
  spaces: Space[];
  onSave: (data: Omit<CalendarEvent, "id" | "author" | "expand">) => Promise<void>;
  onClose: () => void;
}

export function EventModal({ initialDate, initial, spaces, onSave, onClose }: EventModalProps) {
  const isEdit = !!initial;

  const [title, setTitle]           = useState(initial?.title ?? "");
  const [description, setDesc]      = useState(initial?.description ?? "");
  const [date, setDate]             = useState(
    initial?.start.slice(0, 10) ?? initialDate?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [time, setTime]             = useState(
    initial?.start.slice(11, 16) ?? "09:00"
  );
  const [allDay, setAllDay]         = useState(initial?.all_day ?? false);
  const [color, setColor]           = useState(initial?.color ?? COLORS[0]);
  const [spaceId, setSpaceId]       = useState(initial?.space ?? "");
  const [visibility, setVisibility] = useState<CalendarEvent["visibility"]>((initial?.visibility || "publico") as CalendarEvent["visibility"]);
  const [attendeeIds, setAttendeeIds] = useState<string[]>(initial?.attendees ?? []);
  const [loading, setLoading]       = useState(false);

  // User picker state
  const [allUsers, setAllUsers]   = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const myId = getPocketBase().authStore.record?.id ?? "";

  useEffect(() => {
    getPocketBase().collection("users").getFullList({ sort: "name" })
      .then((u) => setAllUsers((u as unknown as User[]).filter((u) => u.id !== myId)))
      .catch(() => {});
  }, [myId]);

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const start = allDay ? `${date} 00:00:00` : `${date} ${time}:00`;
      await onSave({
        title, description, start, all_day: allDay, color,
        space: spaceId || undefined,
        visibility,
        attendees: visibility === "convidados" ? attendeeIds : [],
      });
      onClose();
    } catch { toast.error("Erro ao salvar evento."); }
    finally { setLoading(false); }
  }

  return (
    <ModalShell onClose={onClose} size="md">
      <h3 className="font-semibold mb-4">{isEdit ? "Editar evento" : "Novo evento"}</h3>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Reunião de equipe" className="mt-1 h-9" autoFocus />
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea value={description} onChange={(e) => setDesc(e.target.value)}
            placeholder="Detalhes do evento..." className="mt-1 min-h-[56px] resize-none" rows={2} />
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Data *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs">Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              disabled={allDay} className="mt-1 h-9 disabled:opacity-40" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
          <span className="text-sm">Dia todo</span>
        </label>

        {/* Visibility */}
        <div>
          <Label className="text-xs mb-2 block">Visibilidade</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.entries(VISIBILITY_CFG) as [CalendarEvent["visibility"], typeof VISIBILITY_CFG[keyof typeof VISIBILITY_CFG]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button key={key} onClick={() => setVisibility(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all",
                    visibility === key
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
                  )}>
                  <Icon style={{ width: 14, height: 14 }} className={visibility === key ? cfg.cls : ""} />
                  <span>{cfg.label}</span>
                  <span className={cn("text-[10px] font-normal", visibility === key ? "text-muted-foreground" : "text-muted-foreground/60")}>
                    {cfg.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Attendee picker */}
        {visibility === "convidados" && (
          <div>
            <Label className="text-xs mb-1.5 block">Convidados {attendeeIds.length > 0 && `(${attendeeIds.length})`}</Label>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="relative border-b border-border">
                <Search style={{ width: 12, height: 12 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar pessoa..." className="w-full h-8 pl-8 pr-3 bg-muted/30 text-xs focus:outline-none" />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredUsers.map((u) => {
                  const checked = attendeeIds.includes(u.id);
                  return (
                    <label key={u.id} className={cn(
                      "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
                      checked ? "bg-primary/8" : "hover:bg-muted/40"
                    )}>
                      <input type="checkbox" checked={checked} onChange={() => toggleAttendee(u.id)}
                        className="rounded border-input shrink-0" />
                      <UserAvatar user={u} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.department ?? u.email}</p>
                      </div>
                    </label>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Space */}
        <div>
          <Label className="text-xs">Espaço</Label>
          <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)}
            className="mt-1 w-full h-9 bg-background border border-input rounded-md text-sm px-3 focus:outline-none">
            <option value="">Nenhum</option>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>

        {/* Color */}
        <div>
          <Label className="text-xs mb-2 block">Cor</Label>
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={cn("w-6 h-6 rounded-full transition-transform", color === c && "scale-125 ring-2 ring-offset-1 ring-offset-background")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
        <Button onClick={handleSave} disabled={!title.trim() || loading} className="flex-1 h-9">
          {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar evento"}
        </Button>
      </div>
    </ModalShell>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────────

function ModalShell({ children, onClose, size = "sm" }: { children: React.ReactNode; onClose: () => void; size?: "sm" | "md" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-card border border-border rounded-2xl p-5 shadow-2xl w-full max-h-[90vh] overflow-y-auto",
          size === "md" ? "max-w-md" : "max-w-sm"
        )}>
        {children}
      </motion.div>
    </div>
  );
}
