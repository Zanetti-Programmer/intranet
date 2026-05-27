"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { toast } from "sonner";

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgente", cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
  high:   { label: "Alta",    cls: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
  normal: { label: "Normal",  cls: "bg-muted text-muted-foreground border border-border" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Geral:     "bg-blue-500/15 text-blue-400",
  RH:        "bg-pink-500/15 text-pink-400",
  TI:        "bg-indigo-500/15 text-indigo-400",
  Comercial: "bg-emerald-500/15 text-emerald-400",
  Outros:    "bg-muted text-muted-foreground",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface Props {
  announcement: Announcement & { category?: string };
  index: number;
  canEdit?: boolean;
  onUpdate?: (id: string, data: { title: string; content: string; category: string; priority: string; pinned: boolean }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function AnnouncementCard({ announcement: a, index, canEdit, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState(a.title);
  const [editContent, setEditContent] = useState(a.content);
  const priority = PRIORITY_BADGE[a.priority] ?? PRIORITY_BADGE.normal;
  const author = a.expand?.author;
  const isLong = a.content.length > 200;

  async function handleSave() {
    if (!editTitle.trim() || !onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(a.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: a.category ?? "Geral",
        priority: a.priority,
        pinned: a.pinned,
      });
      setEditing(false);
      toast.success("Aviso atualizado.");
    } catch {
      toast.error("Erro ao atualizar aviso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Excluir este aviso?")) return;
    try {
      await onDelete(a.id);
      toast.success("Aviso excluído.");
    } catch {
      toast.error("Erro ao excluir aviso.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-border/60 transition-colors",
        a.pinned && "border-primary/30 bg-primary/5"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {a.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", priority.cls)}>
            {priority.label}
          </span>
          {a.category && (
            <span className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full",
              CATEGORY_COLORS[a.category] ?? "bg-muted text-muted-foreground"
            )}>
              {a.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground">{timeAgo(a.created)}</span>
          {canEdit && (
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MoreHorizontal style={{ width: 14, height: 14 }} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-7 z-20 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[130px]"
                  >
                    <button onClick={() => { setEditing(true); setEditTitle(a.title); setEditContent(a.content); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors">
                      <Pencil style={{ width: 13, height: 13 }} className="text-muted-foreground" /> Editar
                    </button>
                    <button onClick={() => { setMenuOpen(false); void handleDelete(); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 style={{ width: 13, height: 13 }} /> Excluir
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Edit mode */}
      {editing ? (
        <div className="space-y-2">
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]" />
          <div className="flex items-center gap-2">
            <button onClick={() => void handleSave()} disabled={saving || !editTitle.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Check style={{ width: 13, height: 13 }} /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors">
              <X style={{ width: 13, height: 13 }} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug">{a.title}</h3>

          {/* Body */}
          <p className={cn(
            "text-sm text-muted-foreground leading-relaxed whitespace-pre-line",
            !expanded && isLong && "line-clamp-3"
          )}>
            {a.content}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline">
              {expanded ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </>
      )}

      {/* Footer */}
      {author && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <UserAvatar user={author} size="sm" />
          <span className="text-xs text-muted-foreground">{author.name}</span>
        </div>
      )}
    </motion.div>
  );
}
