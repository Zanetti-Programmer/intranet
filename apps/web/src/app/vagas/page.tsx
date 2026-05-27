"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useVagas, useJobApplications } from "@/lib/hooks/useVagas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Plus, Loader2, Search, Briefcase, X, ChevronDown, ChevronUp, Users,
  Clock, CheckCircle, XCircle, Send, ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { JobPosting, JobApplication } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  "CLT":        "bg-emerald-500/15 text-emerald-400",
  "PJ":         "bg-blue-500/15 text-blue-400",
  "Estágio":    "bg-purple-500/15 text-purple-400",
  "Temporário": "bg-amber-500/15 text-amber-400",
};

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  inscrito:    { label: "Inscrito",     cls: "bg-blue-500/15 text-blue-400" },
  em_analise:  { label: "Em análise",   cls: "bg-amber-500/15 text-amber-400" },
  aprovado:    { label: "Aprovado ✓",   cls: "bg-emerald-500/15 text-emerald-400" },
  reprovado:   { label: "Não aprovado", cls: "bg-red-500/15 text-red-400" },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `${days}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function deadlineDays(dl: string) {
  const diff = new Date(dl).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Último dia";
  return `${days}d restantes`;
}

// ── Applicants panel (RH only) ──────────────────────────────────────────────
function ApplicantsPanel({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { applications, loading, hasMore, loadMore, updateStatus } = useJobApplications(jobId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Candidatos ({applications.length})</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : applications.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhum candidato ainda.</p>
          : (
            <div className="overflow-y-auto space-y-3">
              {applications.map((app, _idx) => {
                const u = app.expand?.user;
                const st = APP_STATUS[app.status] ?? APP_STATUS.inscrito;
                return (
                  <div key={app.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                    {u && <UserAvatar user={u} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{u?.name ?? "—"}</p>
                      {u?.department && <p className="text-xs text-muted-foreground">{u.department}</p>}
                      {app.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">"{app.message}"</p>}
                    </div>
                    <select value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value).then(() => toast.success("Status atualizado"))}
                      className={cn("text-xs rounded-lg border border-input bg-transparent px-2 py-1 focus:outline-none shrink-0", st.cls)}>
                      {Object.entries(APP_STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                  </div>
                );
              })}
              {hasMore && (
                <button onClick={() => loadMore()} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 rounded-lg hover:bg-muted transition-colors">
                  Carregar mais
                </button>
              )}
            </div>
          )
        }
      </motion.div>
    </div>
  );
}

// ── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, index, canManage, hasApplied, onApply, onToggle, onViewApplicants }: {
  job: JobPosting; index: number; canManage: boolean; hasApplied: boolean;
  onApply: (id: string, message: string) => void; onToggle: (id: string, s: string) => void;
  onViewApplicants: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const myId = getPocketBase().authStore.record?.id;
  const router = useRouter();
  const typeCls = TYPE_COLORS[job.type] ?? "bg-muted text-muted-foreground";
  const dl = job.deadline ? deadlineDays(job.deadline) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className={cn("bg-card border border-border rounded-2xl p-4 space-y-3 transition-colors",
        job.status === "encerrada" && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", typeCls)}>{job.type}</span>
            {job.status === "encerrada" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Encerrada</span>}
            {dl && job.status === "aberta" && <span className="text-[11px] text-amber-400 flex items-center gap-1"><Clock style={{ width: 11, height: 11 }} />{dl}</span>}
          </div>
          <h3 className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push(`/vagas/${job.id}`)}>
            {job.title}
          </h3>
          {job.department && <p className="text-xs text-muted-foreground">{job.department}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canManage && (
            <>
              <button onClick={() => onViewApplicants(job.id)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                <Users style={{ width: 12, height: 12 }} /> Candidatos
              </button>
              <button onClick={() => onToggle(job.id, job.status)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                {job.status === "aberta" ? "Encerrar" : "Reabrir"}
              </button>
            </>
          )}
        </div>
      </div>

      <p className={cn("text-sm text-muted-foreground leading-relaxed", !expanded && "line-clamp-3")}>{job.description}</p>

      <div className="flex items-center gap-3">
        {job.requirements && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline flex items-center gap-1">
            {expanded ? <><ChevronUp style={{ width: 12, height: 12 }} />Menos detalhes</> : <><ChevronDown style={{ width: 12, height: 12 }} />Ver requisitos</>}
          </button>
        )}
        <button onClick={() => router.push(`/vagas/${job.id}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink style={{ width: 11, height: 11 }} /> Ver vaga completa
        </button>
      </div>
      {expanded && job.requirements && (
        <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground whitespace-pre-line">{job.requirements}</div>
      )}

      {job.status === "aberta" && !canManage && job.author !== myId && (
        <div className="pt-1 border-t border-border/50">
          {hasApplied ? (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle style={{ width: 13, height: 13 }} /> Candidatura enviada
            </p>
          ) : applying ? (
            <div className="space-y-2">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensagem de apresentação (opcional)..." className="text-xs resize-none" rows={2} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setApplying(false)} className="h-8 text-xs">Cancelar</Button>
                <Button size="sm" onClick={() => onApply(job.id, message)} className="h-8 text-xs gap-1">
                  <Send style={{ width: 12, height: 12 }} /> Enviar candidatura
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={() => setApplying(true)} className="h-8 text-xs gap-1.5">
              <Briefcase style={{ width: 13, height: 13 }} /> Candidatar-me
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── New Job Modal ─────────────────────────────────────────────────────────────
function NewJobModal({ onSubmit, onClose }: {
  onSubmit: (d: any) => Promise<void>; onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [type, setType] = useState("CLT");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const selectCls = "mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  async function submit() {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try { await onSubmit({ title, department, description, requirements, type, deadline }); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nova Vaga</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Departamento</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 h-9" /></div>
          <div><Label className="text-xs">Tipo</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
              {["CLT","PJ","Estágio","Temporário"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div><Label className="text-xs">Prazo de inscrição</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 h-9" /></div>
        <div><Label className="text-xs">Descrição *</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Responsabilidades e contexto da vaga..." className="mt-1 resize-none" rows={3} /></div>
        <div><Label className="text-xs">Requisitos</Label><Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Experiência, formação, habilidades..." className="mt-1 resize-none" rows={3} /></div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !description.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar vaga 💼"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VagasPage() {
  const pathname = usePathname();
  const { jobs, loading, createJob, applyToJob, toggleJobStatus, hasApplied } = useVagas();
  const [showModal, setShowModal] = useState(false);
  const [applicantsJob, setApplicantsJob] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todas" | "aberta" | "encerrada">("aberta");
  const [search, setSearch] = useState("");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canManage = myRole === "admin" || myRole === "rh";

  const filtered = useMemo(() =>
    jobs.filter((j) => (filter === "todas" || j.status === filter) &&
      (!search.trim() || j.title.toLowerCase().includes(search.toLowerCase()) || j.department?.toLowerCase().includes(search.toLowerCase())))
  , [jobs, filter, search]);

  async function handleApply(jobId: string, message: string) {
    try { await applyToJob(jobId, message); toast.success("Candidatura enviada!"); }
    catch { toast.error("Erro ao enviar candidatura."); }
  }

  async function handleToggle(id: string, status: string) {
    try { await toggleJobStatus(id, status); toast.success(status === "aberta" ? "Vaga encerrada." : "Vaga reaberta!"); }
    catch { toast.error("Erro."); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />Vagas Internas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Oportunidades de crescimento dentro da empresa</p>
          </div>
          {canManage && <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0"><Plus className="w-4 h-4" />Nova vaga</Button>}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar vagas..." className="pl-9 h-9" />
        </div>

        <div className="flex gap-1.5">
          {(["aberta","todas","encerrada"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize",
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {f === "aberta" ? "Abertas" : f === "todas" ? "Todas" : "Encerradas"}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">💼</p>
              <p className="font-medium">Nenhuma vaga {filter === "aberta" ? "aberta" : "encontrada"}</p>
              {canManage && <p className="text-sm text-muted-foreground">Clique em "Nova vaga" para publicar.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} canManage={canManage}
                  hasApplied={hasApplied(job.id)}
                  onApply={handleApply} onToggle={handleToggle}
                  onViewApplicants={(id) => setApplicantsJob(id)} />
              ))}
            </div>
          )
        }
      </div>

      <AnimatePresence>
        {showModal && <NewJobModal onSubmit={createJob} onClose={() => setShowModal(false)} />}
        {applicantsJob && <ApplicantsPanel jobId={applicantsJob} onClose={() => setApplicantsJob(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
