"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import getPocketBase from "@/lib/pocketbase";
import { ArrowLeft, Loader2, Briefcase, MapPin, Clock, Calendar, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { JobPosting } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  "CLT":        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "PJ":         "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Estágio":    "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "Temporário": "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

function deadlineInfo(dl: string) {
  const diff = new Date(dl).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { label: "Encerrada", urgent: false };
  if (days === 0) return { label: "Último dia!", urgent: true };
  if (days <= 3) return { label: `${days} dias restantes`, urgent: true };
  return { label: `${days} dias restantes`, urgent: false };
}

export default function VagaPage() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const myId = getPocketBase().authStore.record?.id ?? "";
  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canManage = myRole === "admin" || myRole === "rh";

  useEffect(() => {
    if (!id) return;
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("job_postings").getOne(id, { expand: "author" })
      .then((r) => setJob(r as unknown as JobPosting))
      .catch(() => router.push("/vagas"))
      .finally(() => setLoading(false));

    pb.collection("job_applications").getFirstListItem(`job = "${id}" && user = "${myId}"`)
      .then(() => setApplied(true))
      .catch(() => {});
  }, [id, myId, router]);

  async function handleApply() {
    if (!job) return;
    setApplying(true);
    try {
      await getPocketBase().collection("job_applications").create({
        job: job.id, user: myId, message: message.trim(), status: "inscrito",
      });
      setApplied(true); setShowForm(false);
      toast.success("Candidatura enviada! ✅");
    } catch { toast.error("Erro ao se candidatar."); }
    finally { setApplying(false); }
  }

  async function handleToggleStatus() {
    if (!job) return;
    const newStatus = job.status === "aberta" ? "encerrada" : "aberta";
    try {
      await getPocketBase().collection("job_postings").update(job.id, { status: newStatus });
      setJob({ ...job, status: newStatus });
      toast.success(`Vaga ${newStatus === "aberta" ? "reaberta" : "encerrada"}.`);
    } catch { toast.error("Erro ao atualizar."); }
  }

  if (loading) {
    return (
      <DashboardLayout pathname={pathname}>
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  if (!job) return null;

  const author = job.expand?.author;
  const typeCls = TYPE_COLORS[job.type] ?? TYPE_COLORS["CLT"];
  const isOpen = job.status === "aberta";
  const deadline = job.deadline ? deadlineInfo(job.deadline) : null;
  const pubDate = new Date(job.created).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6">
        <button onClick={() => router.push("/vagas")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para Vagas
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full border", typeCls)}>{job.type}</span>
                  <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full border",
                    isOpen ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border")}>
                    {isOpen ? "Vaga aberta" : "Encerrada"}
                  </span>
                  {deadline && (
                    <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full border",
                      deadline.urgent ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-muted text-muted-foreground border-border")}>
                      <Clock style={{ width: 10, height: 10, display: "inline", marginRight: 3 }} />
                      {deadline.label}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold leading-tight">{job.title}</h1>
                {job.department && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Briefcase style={{ width: 13, height: 13 }} /> {job.department}
                  </p>
                )}
              </div>

              {canManage && (
                <Button variant="outline" size="sm" onClick={() => void handleToggleStatus()}>
                  {isOpen ? "Encerrar vaga" : "Reabrir vaga"}
                </Button>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-4">
              <span className="flex items-center gap-1"><Calendar style={{ width: 12, height: 12 }} /> Publicada em {pubDate}</span>
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Clock style={{ width: 12, height: 12 }} />
                  Até {new Date(job.deadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="font-semibold text-sm mb-2">Descrição da vaga</h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div>
                <h2 className="font-semibold text-sm mb-2">Requisitos</h2>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}

            {/* Posted by */}
            {author && (
              <div className="border-t border-border/50 pt-4 flex items-center gap-2.5">
                <UserAvatar user={author} size="sm" />
                <div>
                  <p className="text-xs text-muted-foreground">Publicado por</p>
                  <p className="text-sm font-medium">{author.name}</p>
                </div>
              </div>
            )}

            {/* Apply */}
            {!canManage && isOpen && (
              <div className="border-t border-border/50 pt-4">
                {applied ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Você já se candidatou a esta vaga
                  </div>
                ) : showForm ? (
                  <div className="space-y-3">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mensagem de apresentação (opcional)..."
                      className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => void handleApply()} disabled={applying} className="gap-1.5">
                        {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Enviar candidatura
                      </Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setShowForm(true)} className="gap-1.5">
                    <Send className="w-4 h-4" /> Candidatar-se
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
