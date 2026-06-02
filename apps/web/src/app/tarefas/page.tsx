"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext, DragOverlay, closestCenter,
  useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { DashboardLayout } from "../layout-dashboard";
import { useTasks } from "@/lib/hooks/useTarefas";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, CheckSquare, X, Trash2, Calendar, Pencil, Search } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, User } from "@/types";

// ── Constants ──────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<Task["priority"], { label: string; dot: string; text: string }> = {
  alta:  { label: "Alta",  dot: "bg-red-500",     text: "text-red-400"    },
  media: { label: "Média", dot: "bg-amber-500",    text: "text-amber-400"  },
  baixa: { label: "Baixa", dot: "bg-emerald-500",  text: "text-emerald-400" },
};

const COLUMNS: { id: Task["status"]; label: string; accent: string; dot: string }[] = [
  { id: "pendente",     label: "Pendente",     accent: "border-t-amber-500",   dot: "bg-amber-500"   },
  { id: "em_andamento", label: "Em andamento", accent: "border-t-blue-500",    dot: "bg-blue-500"    },
  { id: "concluida",    label: "Concluída",    accent: "border-t-emerald-500", dot: "bg-emerald-500" },
];

function dueBadge(d?: string) {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0)  return { label: `${Math.abs(days)}d atrasada`, cls: "text-red-400 bg-red-500/10" };
  if (days === 0) return { label: "Hoje",    cls: "text-amber-400 bg-amber-500/10" };
  if (days === 1) return { label: "Amanhã",  cls: "text-amber-400 bg-amber-500/10" };
  return           { label: `${days}d`,     cls: "text-muted-foreground bg-muted" };
}

// ── Task card content ──────────────────────────────────────────────────────────

function TaskCardContent({ task, myId, onDelete, onEdit, overlay = false }: {
  task: Task; myId: string;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  overlay?: boolean;
}) {
  const p    = PRIORITY_CFG[task.priority];
  const due  = dueBadge(task.due_date);
  const assignee = task.expand?.assignee;
  const canDelete = task.created_by === myId || (getPocketBase().authStore.record as { role?: string })?.role === "admin";

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-3 space-y-2.5 group select-none",
      "hover:border-primary/30 hover:shadow-sm transition-all",
      overlay && "shadow-2xl rotate-1 border-primary/30",
    )}>
      {/* Title + actions */}
      <div className="flex items-start gap-1">
        <p className="text-[13px] font-medium leading-snug flex-1 line-clamp-2">{task.title}</p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground">
            <Pencil style={{ width: 11, height: 11 }} />
          </button>
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-red-400">
              <Trash2 style={{ width: 11, height: 11 }} />
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("flex items-center gap-1 text-[11px] font-medium", p.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dot)} />
          {p.label}
        </span>
        {due && (
          <span className={cn("flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md font-medium", due.cls)}>
            <Calendar style={{ width: 9, height: 9 }} /> {due.label}
          </span>
        )}
        {task.is_team && (
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">Time</span>
        )}
        {assignee && (
          <div className="ml-auto">
            <UserAvatar user={assignee} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draggable card ─────────────────────────────────────────────────────────────

function DraggableCard({ task, myId, onDelete, onEdit }: {
  task: Task; myId: string;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-40 scale-95 transition-transform")}>
      <TaskCardContent task={task} myId={myId} onDelete={onDelete} onEdit={onEdit} />
    </div>
  );
}

// ── Droppable column ───────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, myId, onDelete, onEdit }: {
  column: typeof COLUMNS[0]; tasks: Task[];
  myId: string;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn("w-2 h-2 rounded-full shrink-0", column.dot)} />
        <span className="text-sm font-semibold">{column.label}</span>
        <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
          {tasks.length}
        </span>
      </div>
      <div ref={setNodeRef} className={cn(
        "flex-1 min-h-[140px] space-y-2 rounded-xl p-2 transition-colors",
        isOver ? "bg-primary/8 border border-dashed border-primary/30" : "bg-muted/20",
      )}>
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <DraggableCard task={task} myId={myId} onDelete={onDelete} onEdit={onEdit} />
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-14 text-[11px] text-muted-foreground/40">
            Solte aqui
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task form modal (create + edit) ────────────────────────────────────────────

function TaskModal({ initial, onSubmit, onClose }: {
  initial?: Task;
  onSubmit: (d: { title: string; description: string; assignee: string; due_date: string; priority: string; is_team: boolean }) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle]           = useState(initial?.title ?? "");
  const [description, setDesc]      = useState(initial?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(initial?.assignee ?? "");
  const [dueDate, setDueDate]       = useState(initial?.due_date?.slice(0, 10) ?? "");
  const [priority, setPriority]     = useState<Task["priority"]>(initial?.priority ?? "media");
  const [isTeam, setIsTeam]         = useState(initial?.is_team ?? false);
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    const pb = getPocketBase();
    if (!initial) setAssigneeId(pb.authStore.record?.id ?? "");
    pb.collection("users").getFullList({ sort: "name" })
      .then((u) => setUsers(u as unknown as User[])).catch(() => {});
  }, [initial]);

  async function submit() {
    if (!title.trim() || !assigneeId) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, assignee: assigneeId, due_date: dueDate, priority, is_team: isTeam });
      onClose();
    } catch { toast.error("Erro ao salvar tarefa."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{initial ? "Editar tarefa" : "Nova tarefa"}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div>
          <Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus />
        </div>

        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea value={description} onChange={(e) => setDesc(e.target.value)} className="mt-1 resize-none" rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Responsável *</Label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              <option value="">Selecionar...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Prioridade</Label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Prazo</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 h-9" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isTeam} onChange={(e) => setIsTeam(e.target.checked)} className="rounded border-input" />
          <span className="text-sm">Tarefa de time (visível para todos)</span>
        </label>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !assigneeId || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : initial ? "Salvar" : "Criar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TarefasPage() {
  const pathname = usePathname();
  const [view, setView]             = useState<"minhas" | "time" | "criadas">("minhas");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [priorityFilter, setPF]     = useState("todos");
  const [search, setSearch]         = useState("");

  const { tasks, loading, createTask, updateStatus, updateTask, deleteTask } = useTasks(view);
  const myId = getPocketBase().authStore.record?.id ?? "";

  const filtered = useMemo(() => tasks.filter((t) => {
    if (priorityFilter !== "todos" && t.priority !== priorityFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, priorityFilter, search]);

  const metrics = useMemo(() => ({
    pendente:     tasks.filter((t) => t.status === "pendente").length,
    em_andamento: tasks.filter((t) => t.status === "em_andamento").length,
    concluida:    tasks.filter((t) => t.status === "concluida").length,
    atrasadas:    tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "concluida").length,
  }), [tasks]);

  const byStatus = useMemo(() => {
    const m: Record<string, Task[]> = { pendente: [], em_andamento: [], concluida: [] };
    filtered.forEach((t) => { if (m[t.status]) m[t.status].push(t); });
    return m;
  }, [filtered]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string); }
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.status !== newStatus && COLUMNS.some((c) => c.id === newStatus)) {
      updateStatus(task.id, newStatus as Task["status"]);
    }
  }

  async function handleDelete(id: string) {
    try { await deleteTask(id); toast.success("Tarefa removida."); }
    catch { toast.error("Erro ao remover."); }
  }

  async function handleEdit(task: Task, data: Parameters<typeof createTask>[0]) {
    try {
      await updateTask(task.id, { ...data, priority: data.priority as Task["priority"] });
      toast.success("Tarefa atualizada.");
    } catch { toast.error("Erro ao atualizar."); }
  }

  const METRICS_CFG = [
    { label: "Pendentes",    count: metrics.pendente,     color: "text-amber-400",        bg: "bg-amber-500/10"  },
    { label: "Em andamento", count: metrics.em_andamento, color: "text-blue-400",         bg: "bg-blue-500/10"   },
    { label: "Concluídas",   count: metrics.concluida,    color: "text-emerald-400",      bg: "bg-emerald-500/10"},
    { label: "Atrasadas",    count: metrics.atrasadas,    color: "text-red-400",          bg: "bg-red-500/10"    },
  ];

  return (
    <DashboardLayout pathname={pathname}>
      <div className="px-5 py-6 space-y-5 max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" /> Tarefas
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Nova tarefa
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS_CFG.map((m) => (
            <div key={m.label} className={cn("rounded-xl p-3 border border-border/60", m.bg)}>
              <p className={cn("text-2xl font-bold", m.color)}>{m.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View tabs */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {([ ["minhas","Minhas"], ["time","Time"], ["criadas","Criadas"] ] as const).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                className={cn("px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Priority filter */}
          {[
            { v: "todos", label: "Prioridade" },
            ...Object.entries(PRIORITY_CFG).map(([v, c]) => ({ v, label: c.label })),
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setPF(v)}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                priorityFilter === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}

          {/* Search */}
          <div className="relative ml-auto">
            <Search style={{ width: 13, height: 13 }} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarefa..."
              className="h-8 pl-7 pr-3 bg-muted border-0 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44" />
          </div>
        </div>

        {/* Kanban */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={byStatus[col.id] ?? []}
                  myId={myId}
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask && (
                <TaskCardContent task={activeTask} myId={myId} onDelete={() => {}} onEdit={() => {}} overlay />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <TaskModal
            onSubmit={createTask}
            onClose={() => setShowCreate(false)}
          />
        )}
        {editingTask && (
          <TaskModal
            initial={editingTask}
            onSubmit={(data) => handleEdit(editingTask, data)}
            onClose={() => setEditingTask(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
