"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../layout-dashboard";
import { useTickets, useTicketComments } from "@/lib/hooks/useTickets";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

const STATUS_OPTS: { value: Ticket["status"]; label: string; class: string }[] = [
  { value: "aberto",       label: "Aberto",       class: "bg-blue-500/15 text-blue-400" },
  { value: "em_andamento", label: "Em andamento", class: "bg-amber-500/15 text-amber-400" },
  { value: "resolvido",    label: "Resolvido",    class: "bg-green-500/15 text-green-400" },
  { value: "fechado",      label: "Fechado",      class: "bg-muted text-muted-foreground" },
];
const PRIORITY_COLOR: Record<Ticket["priority"], string> = {
  urgente: "text-red-400", alta: "text-orange-400", media: "text-yellow-400", baixa: "text-blue-400",
};

export default function TicketDetailPage() {
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { tickets, loading, updateStatus } = useTickets();
  const ticket = tickets.find((t) => t.id === id);
  const { comments, loading: commentsLoading, addComment } = useTicketComments(id);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const myId = getPocketBase().authStore.record?.id;
  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canChangeStatus = myRole === "admin" || myRole === "ti" || ticket?.author === myId;

  async function handleComment() {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try { await addComment(newComment.trim()); setNewComment(""); }
    finally { setSendingComment(false); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !ticket ? (
          <p className="text-muted-foreground">Chamado não encontrado</p>
        ) : (
          <>
            {/* Ticket header */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-lg font-semibold">{ticket.title}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium",
                      STATUS_OPTS.find((s) => s.value === ticket.status)?.class)}>
                      {STATUS_OPTS.find((s) => s.value === ticket.status)?.label}
                    </span>
                    <span className={cn("text-[11px] font-medium", PRIORITY_COLOR[ticket.priority])}>
                      ● {ticket.priority}
                    </span>
                    <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {ticket.category}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <div className="flex items-center gap-1.5">
                  {ticket.expand?.author && <UserAvatar user={ticket.expand.author} size="sm" />}
                  <span>{ticket.expand?.author?.name}</span>
                  <span>· {formatDistanceToNow(ticket.created)}</span>
                </div>
                {ticket.expand?.assignee && (
                  <span className="text-primary text-xs">Responsável: {ticket.expand.assignee.name}</span>
                )}
              </div>
            </div>

            {/* Status change (for TI/admin) */}
            {canChangeStatus && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Atualizar status</p>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUS_OPTS.map((s) => (
                    <button key={s.value} onClick={() => updateStatus(ticket.id, s.value)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                        ticket.status === s.value ? s.class + " border-current" : "bg-muted text-muted-foreground border-transparent hover:text-foreground")}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Comentários {comments.length > 0 && `(${comments.length})`}</h2>
              {commentsLoading ? (
                <p className="text-xs text-muted-foreground">Carregando...</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((c) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-xl p-3 flex gap-2.5">
                      {c.expand?.author && <UserAvatar user={c.expand.author} size="sm" className="shrink-0 mt-0.5" />}
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-medium">{c.expand?.author?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(c.created)}</span>
                        </div>
                        <p className="text-sm mt-0.5">{c.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              <div className="flex gap-2">
                <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); }}}
                  placeholder="Adicionar comentário..." rows={2} className="resize-none text-sm" />
                <Button onClick={handleComment} disabled={!newComment.trim() || sendingComment} size="sm" className="self-end h-9 px-4">
                  {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
