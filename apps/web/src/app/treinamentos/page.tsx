"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useTrainings } from "@/lib/hooks/useTreinamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, GraduationCap, X, CheckCircle2, PlayCircle, Clock } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Training } from "@/types";

const CATEGORIES = ["Onboarding", "Técnico", "Gestão", "Compliance", "Outros"];

const CAT_COLORS: Record<string, string> = {
  Onboarding:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Técnico:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Gestão:      "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Compliance:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Outros:      "bg-muted text-muted-foreground border-border",
};

function TrainingCard({ training, completed, onComplete, index }: {
  training: Training; completed: boolean; onComplete: (id: string) => void; index: number;
}) {
  const catStyle = CAT_COLORS[training.category] ?? CAT_COLORS["Outros"];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className={cn("bg-card border border-border rounded-2xl p-4 space-y-3 flex flex-col",
        completed && "border-emerald-500/30 bg-emerald-500/5")}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-[11px] px-2 py-0.5 rounded-full border", catStyle)}>
          {training.category}
        </span>
        {completed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="font-semibold text-sm leading-snug">{training.title}</h3>
        {training.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{training.description}</p>
        )}
      </div>
      {training.duration && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock style={{ width: 12, height: 12 }} />{training.duration}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        {training.video_url && (
          <a href={training.video_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted/50 transition-colors">
            <PlayCircle style={{ width: 14, height: 14 }} />Assistir
          </a>
        )}
        {!completed ? (
          <button onClick={() => onComplete(training.id)}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
            <CheckCircle2 style={{ width: 14, height: 14 }} />Marcar concluído
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            <CheckCircle2 style={{ width: 14, height: 14 }} />Concluído
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NewTrainingModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("Técnico");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, video_url: videoUrl, duration, category });
      onClose();
    } catch { toast.error("Erro ao criar treinamento."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Novo treinamento</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus /></div>
        <div><Label className="text-xs">Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 resize-none" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Categoria</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Duração</Label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="ex: 45min" className="mt-1 h-9" />
          </div>
        </div>
        <div><Label className="text-xs">URL do vídeo (YouTube/Vimeo)</Label>
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="mt-1 h-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TreinamentosPage() {
  const pathname = usePathname();
  const { trainings, loading, createTraining, markComplete, isCompleted } = useTrainings();
  const [showModal, setShowModal] = useState(false);
  const [catFilter, setCatFilter] = useState("all");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canCreate = myRole === "admin" || myRole === "rh" || myRole === "ti";

  const filtered = useMemo(() =>
    catFilter === "all" ? trainings : trainings.filter((t) => t.category === catFilter),
  [trainings, catFilter]);

  const completedCount = trainings.filter((t) => isCompleted(t.id)).length;
  const pct = trainings.length > 0 ? Math.round((completedCount / trainings.length) * 100) : 0;

  async function handleComplete(id: string) {
    try { await markComplete(id); toast.success("Treinamento concluído!"); }
    catch { toast.error("Erro ao registrar conclusão."); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />Treinamentos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Capacitação e desenvolvimento da equipe</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" />Novo
            </Button>
          )}
        </div>

        {trainings.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Seu progresso</span>
              <span className="text-muted-foreground">{completedCount}/{trainings.length} concluídos</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{pct}% completo</p>
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {[["all", "Todos"], ...CATEGORIES.map((c) => [c, c])].map(([v, l]) => (
            <button key={v} onClick={() => setCatFilter(v as string)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                catFilter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🎓</p>
            <p className="font-medium">Nenhum treinamento encontrado</p>
            {canCreate && <p className="text-sm text-muted-foreground">Adicione o primeiro treinamento da equipe.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t, i) => (
              <TrainingCard key={t.id} training={t} index={i}
                completed={isCompleted(t.id)} onComplete={handleComplete} />
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && <NewTrainingModal onSubmit={createTraining} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
