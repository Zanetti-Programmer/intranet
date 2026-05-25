"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { usePolls } from "@/lib/hooks/usePesquisas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, BarChart2, X, Trash2, CheckCircle2, Lock } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Poll } from "@/types";

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days < 30) return `${days}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function PollCard({ poll, voteCounts, voted, votedIdx, totalVotes, onVote, onClose, canManage, index }: {
  poll: Poll; voteCounts: number[]; voted: boolean; votedIdx: number;
  totalVotes: number; onVote: (pollId: string, idx: number) => void;
  onClose: (id: string) => void; canManage: boolean; index: number;
}) {
  const isExpired = poll.deadline ? new Date(poll.deadline) < new Date() : false;
  const showResults = voted || poll.status === "encerrada" || isExpired;
  const author = poll.expand?.author;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className={cn("bg-card border border-border rounded-2xl p-4 space-y-4",
        poll.status === "encerrada" && "opacity-80")}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          {poll.status === "encerrada" && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              <Lock style={{ width: 10, height: 10 }} />Encerrada
            </span>
          )}
          <p className="font-semibold text-sm leading-snug">{poll.question}</p>
        </div>
        {canManage && poll.status === "ativa" && (
          <button onClick={() => onClose(poll.id)} title="Encerrar enquete"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-amber-400 transition-colors">
            <Lock style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((opt, idx) => {
          const count = voteCounts[idx] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = votedIdx === idx;

          return (
            <div key={idx}>
              {!showResults && poll.status === "ativa" ? (
                <button onClick={() => onVote(poll.id, idx)}
                  className="w-full text-left px-3 py-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm">
                  {opt}
                </button>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn("font-medium", isMyVote && "text-primary")}>
                      {isMyVote && <CheckCircle2 className="inline w-3 h-3 mr-1" />}{opt}
                    </span>
                    <span className="text-muted-foreground">{pct}% · {count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500",
                      isMyVote ? "bg-primary" : "bg-muted-foreground/40")}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
        <span>{totalVotes} {totalVotes === 1 ? "voto" : "votos"}</span>
        <span>
          {voted && poll.status === "ativa" && "Você já votou ✓"}
          {poll.deadline && ` · Prazo: ${new Date(poll.deadline).toLocaleDateString("pt-BR")}`}
          {isExpired && poll.status === "ativa" && " · Expirada"}
        </span>
        {author && <span>{author.name} · {timeAgo(poll.created)}</span>}
      </div>
    </motion.div>
  );
}

function NewPollModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  function addOption() { if (options.length < 6) setOptions([...options, ""]); }
  function removeOption(i: number) { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); }
  function setOption(i: number, v: string) { setOptions(options.map((o, idx) => idx === i ? v : o)); }

  const validOptions = options.filter((o) => o.trim());

  async function submit() {
    if (!question.trim() || validOptions.length < 2) return;
    setLoading(true);
    try {
      await onSubmit({ question, options: validOptions, deadline });
      onClose();
    } catch { toast.error("Erro ao criar enquete."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nova enquete</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div>
          <Label className="text-xs">Pergunta *</Label>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-1 h-9" autoFocus placeholder="O que você quer perguntar?" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Opções * (mínimo 2)</Label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input value={opt} onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Opção ${i + 1}`} className="h-9 flex-1" />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button onClick={addOption} className="text-xs text-primary hover:underline">+ Adicionar opção</button>
          )}
        </div>
        <div>
          <Label className="text-xs">Prazo (opcional)</Label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 h-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!question.trim() || validOptions.length < 2 || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar enquete"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PesquisasPage() {
  const pathname = usePathname();
  const { polls, loading, voteCounts, createPoll, vote, closePoll, hasVoted, getVotedIdx, totalVotes } = usePolls();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"ativa" | "encerrada" | "all">("ativa");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canCreate = myRole === "admin" || myRole === "rh";

  const filtered = useMemo(() =>
    filter === "all" ? polls : polls.filter((p) => p.status === filter),
  [polls, filter]);

  async function handleVote(pollId: string, idx: number) {
    try { await vote(pollId, idx); toast.success("Voto registrado!"); }
    catch { toast.error("Erro ao votar."); }
  }

  async function handleClose(id: string) {
    try { await closePoll(id); toast.success("Enquete encerrada."); }
    catch { toast.error("Erro ao encerrar."); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />Pesquisas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Enquetes e pesquisas de clima organizacional</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" />Nova enquete
            </Button>
          )}
        </div>

        <div className="flex gap-1.5">
          {[["ativa","Ativas"],["encerrada","Encerradas"],["all","Todas"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v as typeof filter)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">📊</p>
            <p className="font-medium">Nenhuma enquete encontrada</p>
            {canCreate && <p className="text-sm text-muted-foreground">Crie uma enquete para ouvir a equipe.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((poll, i) => (
              <PollCard key={poll.id} poll={poll} index={i}
                voteCounts={voteCounts[poll.id] ?? new Array(poll.options.length).fill(0)}
                voted={hasVoted(poll.id)} votedIdx={getVotedIdx(poll.id)}
                totalVotes={totalVotes(poll.id)}
                onVote={handleVote} onClose={handleClose} canManage={canCreate} />
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && <NewPollModal onSubmit={createPoll} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
