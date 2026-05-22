"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useTasks } from "@/lib/hooks/useTarefas";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, CheckSquare, X, Trash2, Flag, Calendar } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, User } from "@/types";

const PRIORITY_STYLES: Record<string, { label: string; dot: string; text: string }> = {
  alta:  { label: "Alta",  dot: "bg-red-500",    text: "text-red-400" },
  media: { label: "Média", dot: "bg-amber-500",   text: "text-amber-400" },
  baixa: { label: "Baixa", dot: "bg-emerald-500", text: "text-emerald-400" },
};

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "pendente",      label: "Pendente",      color: "border-t-amber-500" },
  { key: "em_andamento",  label: "Em andamento",  color: "border-t-blue-500" },
  { key: "concluida",     label: "Concluída",     color: "border-t-emerald-500" },
];

function dueDateLabel(d?: string) {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d atrasada`, cls: "text-red-400" };
  if (days === 0) return { label: "Hoje", cls: "text-amber-400" };
  if (days === 1) return { label: "Amanhã", cls: "text-amber-400" };
  return { label: `${days}d`, cls: "text-muted-foreground" };
}

function TaskCard({ task, onStatusChange, onDelete, myId }: {
  task: Task; onStatusChange: (id: string, s: Task["status"]) => void;
  onDelete: (id: string) => void; myId: string;
}) {
  const prio = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.baixa;
  const due = dueDateLabel(task.due_date);
  const assignee = task.expand?.assignee;
  const canDelete = task.created_by === myId || (getPocketBase().authStore.record as any)?.role === "admin";

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2 group">
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
        {canDelete && (
          <button onClick={() => onDelete(task.id)}
            className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>
      {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("flex items-center gap-1 text-xs", prio.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", prio.dot)} />{prio.label}
        </span>
        {due && (
          <span className={cn("flex items-center gap-1 text-xs", due.cls)}>
            <Calendar style={{ width: 10, height: 10 }} />{due.label}
          </span>
        )}
        {assignee && <UserAvatar user={assignee} size="sm" />}
      </div>
      <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value as Task["status"])}
        className="w-full h-7 rounded-lg border border-input bg-transparent px-2 text-xs focus:outline-none">
        <option value="pendente">Pendente</option>
        <option value="em_andamento">Em andamento</option>
        <option value="concluida">Concluída</option>
      </select>
    </div>
  );
}

function NewTaskModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("media");
  const [isTeam, setIsTeam] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pb = getPocketBase();
    setAssigneeId(pb.authStore.record?.id ?? "");
    pb.collection("users").getFullList({ sort: "name" })
      .then((u) => setUsers(u as unknown as User[])).catch(() => {});
  }, []);

  async function submit() {
    if (!title.trim() || !assigneeId) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, assignee: assigneeId, due_date: dueDate, priority, is_team: isTeam });
      onClose();
    } catch { toast.error("Erro ao criar tarefa."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nova tarefa</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus />
        </div>
        <div><Label className="text-xs">Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 resize-none" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Responsável *</Label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              <option value="">Selecionar...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Prioridade</Label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>
        <div><Label className="text-xs">Prazo</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 h-9" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isTeam} onChange={(e) => setIsTeam(e.target.checked)}
            className="rounded border-input" />
          <span className="text-sm">Tarefa de time (visível para todos)</span>
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !assigneeId || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TarefasPage() {
  const pathname = usePathname();
  const [view, setView] = useState<"minhas" | "time" | "criadas">("minhas");
  const { tasks, loading, createTask, updateStatus, deleteTask } = useTasks(view);
  const [showModal, setShowModal] = useState(false);

  const myId = getPocketBase().authStore.record?.id ?? "";

  const columns = useMemo(() =>
    COLUMNS.map((col) => ({
      ...col, items: tasks.filter((t) => t.status === col.key),
    })),
  [tasks]);

  async function handleStatusChange(id: string, status: Task["status"]) {
    try { await updateStatus(id, status); }
    catch { toast.error("Erro ao atualizar status."); }
  }

  async function handleDelete(id: string) {
    try { await deleteTask(id); toast.success("Tarefa removida."); }
    catch { toast.error("Erro ao remover."); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-6xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />Tarefas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe suas tarefas e as do time</p>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />Nova tarefa
          </Button>
        </div>

        <div className="flex gap-1.5">
          {([["minhas","Minhas"],["time","Time"],["criadas","Criadas por mim"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                view === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => (
              <div key={col.key} className={cn("bg-card/50 border-t-2 border border-border rounded-2xl p-3 space-y-3", col.color)}>
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{col.items.length}</span>
                </div>
                <AnimatePresence>
                  {col.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Nenhuma tarefa</p>
                  ) : (
                    col.items.map((task) => (
                      <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <TaskCard task={task} myId={myId} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && <NewTaskModal onSubmit={createTask} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
