"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  DndContext, DragOverlay, closestCenter,
  useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { DashboardLayout } from "../layout-dashboard";
import { TicketCard } from "@/components/tickets/TicketCard";
import { TicketForm } from "@/components/tickets/TicketForm";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useTickets } from "@/lib/hooks/useTickets";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { Plus, Loader2, LayoutGrid, List, Table2, ChevronDown, Clock } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import Link from "next/link";
import type { Ticket } from "@/types";

// ── Constants ──────────────────────────────────────────────────────────────────

type ViewMode = "kanban" | "list" | "table";

const STATUS_CFG: Record<Ticket["status"], { label: string; bg: string; text: string; border: string; dot: string }> = {
  aberto:       { label: "Aberto",        bg: "bg-blue-500/15",  text: "text-blue-400",        border: "border-blue-500/30",  dot: "bg-blue-500"          },
  em_andamento: { label: "Em andamento",  bg: "bg-amber-500/15", text: "text-amber-400",       border: "border-amber-500/30", dot: "bg-amber-500"         },
  resolvido:    { label: "Resolvido",     bg: "bg-green-500/15", text: "text-green-400",       border: "border-green-500/30", dot: "bg-green-500"         },
  fechado:      { label: "Fechado",       bg: "bg-muted",        text: "text-muted-foreground", border: "border-border",       dot: "bg-muted-foreground"  },
};

const PRIORITY_CFG: Record<Ticket["priority"], { label: string; dot: string; text: string }> = {
  urgente: { label: "Urgente", dot: "bg-red-500",    text: "text-red-400"    },
  alta:    { label: "Alta",    dot: "bg-orange-500", text: "text-orange-400" },
  media:   { label: "Média",   dot: "bg-yellow-400", text: "text-yellow-400" },
  baixa:   { label: "Baixa",   dot: "bg-blue-400",   text: "text-blue-400"   },
};

const CATEGORY_LABEL: Record<Ticket["category"], string> = {
  hardware: "Hardware", software: "Software",
  rede: "Rede", acesso: "Acesso", outro: "Outro",
};

const COLUMNS: { id: Ticket["status"]; label: string }[] = [
  { id: "aberto",       label: "Aberto"        },
  { id: "em_andamento", label: "Em Andamento"  },
  { id: "resolvido",    label: "Resolvido"     },
  { id: "fechado",      label: "Fechado"       },
];

// ── Kanban card content (shared with DragOverlay) ─────────────────────────────

function KanbanCardContent({ ticket, overlay = false }: { ticket: Ticket; overlay?: boolean }) {
  const p = PRIORITY_CFG[ticket.priority];
  const assignee = ticket.expand?.assignee;
  const author   = ticket.expand?.author;
  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date() && ticket.status !== "fechado";

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-3 space-y-2 select-none",
      "hover:border-primary/30 hover:shadow-sm transition-all",
      overlay && "shadow-2xl rotate-1 border-primary/30",
    )}>
      <div className="flex items-center gap-1.5">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dot)} />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          {CATEGORY_LABEL[ticket.category]}
        </span>
        {isOverdue && (
          <span className="ml-auto flex items-center gap-0.5 text-[10px] text-red-400">
            <Clock style={{ width: 9, height: 9 }} /> Atrasado
          </span>
        )}
      </div>
      <p className="text-[13px] font-medium leading-snug line-clamp-2">{ticket.title}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(ticket.created)}</span>
        <div className="flex items-center gap-1">
          {(assignee ?? author) && (
            <UserAvatar user={(assignee ?? author)!} size="sm" className={cn(!assignee && "opacity-40")} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Draggable kanban card ──────────────────────────────────────────────────────

function DraggableCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-40 scale-95")}>
      <Link href={`/chamados/${ticket.id}`}
        onClick={(e) => { if (isDragging) e.preventDefault(); }}
        className="block">
        <KanbanCardContent ticket={ticket} />
      </Link>
    </div>
  );
}

// ── Droppable column ───────────────────────────────────────────────────────────

function KanbanColumn({ column, tickets }: { column: typeof COLUMNS[0]; tickets: Ticket[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const cfg = STATUS_CFG[column.id];

  return (
    <div className="flex flex-col w-[270px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
        <span className="text-sm font-semibold">{column.label}</span>
        <span className={cn("ml-auto text-[11px] px-1.5 py-0.5 rounded-full font-medium", cfg.bg, cfg.text)}>
          {tickets.length}
        </span>
      </div>
      <div ref={setNodeRef} className={cn(
        "flex-1 min-h-[120px] space-y-2 rounded-xl p-2 transition-colors",
        isOver ? "bg-primary/8 border border-dashed border-primary/30" : "bg-muted/20",
      )}>
        {tickets.map((t) => <DraggableCard key={t.id} ticket={t} />)}
        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-16 text-[11px] text-muted-foreground/40">
            Solte aqui
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban board ───────────────────────────────────────────────────────────────

function KanbanView({ tickets, onUpdateStatus }: { tickets: Ticket[]; onUpdateStatus: (id: string, s: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTicket = activeId ? tickets.find((t) => t.id === activeId) ?? null : null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = useMemo(() => {
    const m: Record<string, Ticket[]> = { aberto: [], em_andamento: [], resolvido: [], fechado: [] };
    tickets.forEach((t) => { if (m[t.status]) m[t.status].push(t); });
    return m;
  }, [tickets]);

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string); }
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const newStatus = over.id as string;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket && ticket.status !== newStatus && COLUMNS.some((c) => c.id === newStatus)) {
      onUpdateStatus(ticket.id, newStatus);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.id} column={col} tickets={byStatus[col.id] ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeTicket && (
          <div className="w-[270px]">
            <KanbanCardContent ticket={activeTicket} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ── Table view ─────────────────────────────────────────────────────────────────

function TableView({ tickets, canEdit, onUpdateStatus, onUpdatePriority }: {
  tickets: Ticket[];
  canEdit: boolean;
  onUpdateStatus: (id: string, s: string) => void;
  onUpdatePriority: (id: string, p: string) => void;
}) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<{ id: string; field: "status" | "priority" } | null>(null);

  useEffect(() => {
    function close() { setOpenMenu(null); }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (tickets.length === 0) {
    return <div className="text-center py-16 text-sm text-muted-foreground">Nenhum chamado encontrado</div>;
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Título", "Categoria", "Prioridade", "Responsável", "Status", "Aberto"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {tickets.map((t) => {
              const p = PRIORITY_CFG[t.priority];
              const s = STATUS_CFG[t.status];
              return (
                <tr key={t.id} onClick={() => router.push(`/chamados/${t.id}`)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group">
                  {/* Título */}
                  <td className="px-4 py-3 max-w-[240px]">
                    <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>
                  </td>
                  {/* Categoria */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{CATEGORY_LABEL[t.category]}</span>
                  </td>
                  {/* Prioridade */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(
                        openMenu?.id === t.id && openMenu.field === "priority" ? null : { id: t.id, field: "priority" }
                      )} className={cn("flex items-center gap-1.5 text-xs font-medium", p.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />
                        {p.label}
                        {canEdit && <ChevronDown style={{ width: 10, height: 10 }} className="opacity-50" />}
                      </button>
                      {openMenu?.id === t.id && openMenu.field === "priority" && canEdit && (
                        <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
                          {(Object.keys(PRIORITY_CFG) as Ticket["priority"][]).map((val) => {
                            const cfg = PRIORITY_CFG[val];
                            return (
                              <button key={val} onClick={() => { onUpdatePriority(t.id, val); setOpenMenu(null); }}
                                className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors", cfg.text)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} /> {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Responsável */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.expand?.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <UserAvatar user={t.expand.assignee} size="sm" />
                        <span className="text-xs">{t.expand.assignee.name.split(" ")[0]}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(
                        openMenu?.id === t.id && openMenu.field === "status" ? null : { id: t.id, field: "status" }
                      )} className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap", s.bg, s.text, s.border)}>
                        {s.label}
                        {canEdit && <ChevronDown style={{ width: 10, height: 10 }} className="opacity-60" />}
                      </button>
                      {openMenu?.id === t.id && openMenu.field === "status" && canEdit && (
                        <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 py-1 min-w-[150px]">
                          {COLUMNS.map((col) => {
                            const cfg = STATUS_CFG[col.id];
                            return (
                              <button key={col.id} onClick={() => { onUpdateStatus(t.id, col.id); setOpenMenu(null); }}
                                className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors", cfg.text)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} /> {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Data */}
                  <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(t.created)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ChamadosPage() {
  const pathname = usePathname();
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");
  const [priorityFilter, setPriorityFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [myOnly, setMyOnly] = useState(false);

  const { tickets, loading, createTicket, updateStatus, updateTicket } = useTickets();
  const myId  = getPocketBase().authStore.record?.id ?? "";
  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canEdit = myRole === "admin" || myRole === "ti";

  useEffect(() => {
    const saved = localStorage.getItem("chamados-view") as ViewMode | null;
    if (saved) setView(saved);
  }, []);

  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem("chamados-view", v);
  }

  const filtered = useMemo(() => tickets.filter((t) => {
    if (priorityFilter !== "todos" && t.priority !== priorityFilter) return false;
    if (categoryFilter !== "todos" && t.category !== categoryFilter) return false;
    if (myOnly && t.author !== myId && t.assignee !== myId) return false;
    return true;
  }), [tickets, priorityFilter, categoryFilter, myOnly, myId]);

  const metrics = useMemo(() => ({
    aberto:       tickets.filter((t) => t.status === "aberto").length,
    em_andamento: tickets.filter((t) => t.status === "em_andamento").length,
    resolvido:    tickets.filter((t) => t.status === "resolvido").length,
    fechado:      tickets.filter((t) => t.status === "fechado").length,
    urgente:      tickets.filter((t) => t.priority === "urgente" && t.status !== "fechado").length,
  }), [tickets]);

  const METRICS = [
    { label: "Abertos",      count: metrics.aberto,       color: "text-blue-400",          bg: "bg-blue-500/10"  },
    { label: "Em andamento", count: metrics.em_andamento, color: "text-amber-400",         bg: "bg-amber-500/10" },
    { label: "Resolvidos",   count: metrics.resolvido,    color: "text-green-400",         bg: "bg-green-500/10" },
    { label: "Fechados",     count: metrics.fechado,      color: "text-muted-foreground",  bg: "bg-muted/40"     },
    { label: "Urgentes",     count: metrics.urgente,      color: "text-red-400",           bg: "bg-red-500/10"   },
  ];

  return (
    <DashboardLayout pathname={pathname}>
      <div className="px-5 py-6 space-y-5 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Chamados de TI</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tickets.length} chamado{tickets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Novo chamado
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {METRICS.map((m) => (
            <div key={m.label} className={cn("rounded-xl p-3 border border-border/60", m.bg)}>
              <p className={cn("text-2xl font-bold", m.color)}>{m.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {([
              { v: "kanban" as const, icon: LayoutGrid, label: "Kanban" },
              { v: "list"   as const, icon: List,       label: "Lista"  },
              { v: "table"  as const, icon: Table2,     label: "Tabela" },
            ]).map(({ v, icon: Icon, label }) => (
              <button key={v} onClick={() => changeView(v)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  view === v
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")}>
                <Icon style={{ width: 13, height: 13 }} /> {label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Priority filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {[{ v: "todos", label: "Prioridade" }, ...Object.entries(PRIORITY_CFG).map(([v, c]) => ({ v, label: c.label }))].map(({ v, label }) => (
              <button key={v} onClick={() => setPriorityFilter(v)}
                className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                  priorityFilter === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 bg-muted border-0 rounded-lg text-xs px-2 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
            <option value="todos">Todas categorias</option>
            {(Object.keys(CATEGORY_LABEL) as Ticket["category"][]).map((v) => (
              <option key={v} value={v}>{CATEGORY_LABEL[v]}</option>
            ))}
          </select>

          {/* My tickets */}
          <button onClick={() => setMyOnly((v) => !v)}
            className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
              myOnly
                ? "bg-primary/15 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground hover:text-foreground")}>
            Meus chamados
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : view === "kanban" ? (
          <KanbanView tickets={filtered} onUpdateStatus={canEdit ? updateStatus : () => {}} />
        ) : view === "table" ? (
          <TableView
            tickets={filtered}
            canEdit={canEdit}
            onUpdateStatus={updateStatus}
            onUpdatePriority={(id, p) => updateTicket(id, { priority: p as Ticket["priority"] })}
          />
        ) : (
          <div className="space-y-2 max-w-3xl">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">Nenhum chamado encontrado</div>
            ) : (
              filtered.map((t) => <TicketCard key={t.id} ticket={t} />)
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <TicketForm
            onSubmit={async (data) => { await createTicket(data); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
