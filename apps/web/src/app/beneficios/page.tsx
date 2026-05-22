"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useBeneficios } from "@/lib/hooks/useBeneficios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, X, Gift, ExternalLink, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Benefit } from "@/types";

const CATEGORIES = ["Saúde", "Alimentação", "Transporte", "Educação", "Lazer", "Outros"];

const CAT_COLORS: Record<string, string> = {
  "Saúde":       "bg-red-500/15 text-red-400 border-red-500/20",
  "Alimentação": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Transporte":  "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Educação":    "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "Lazer":       "bg-pink-500/15 text-pink-400 border-pink-500/20",
  "Outros":      "bg-muted text-muted-foreground border-border",
};

const EMOJIS = ["🏥","🦷","👁️","💊","🥗","🍽️","🚌","🚗","📚","🎓","💻","🏋️","🎬","🎁","💰","⭐"];

function BenefitCard({ benefit, canManage, onDelete, index }: {
  benefit: Benefit; canManage: boolean; onDelete: (id: string) => void; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const catCls = CAT_COLORS[benefit.category] ?? CAT_COLORS["Outros"];
  const hasDetails = benefit.details && benefit.details.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-border/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border", catCls)}>
          {benefit.icon || "🎁"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm">{benefit.title}</h3>
            {canManage && (
              <button onClick={() => onDelete(benefit.id)} className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border inline-block mt-0.5", catCls)}>
            {benefit.category}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>

      {hasDetails && (
        <>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline flex items-center gap-1">
            {expanded ? <><ChevronUp style={{ width: 12, height: 12 }} />Menos detalhes</> : <><ChevronDown style={{ width: 12, height: 12 }} />Ver detalhes completos</>}
          </button>
          {expanded && (
            <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {benefit.details}
            </div>
          )}
        </>
      )}

      {benefit.link && (
        <a href={benefit.link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline">
          <ExternalLink style={{ width: 12, height: 12 }} /> Acessar portal
        </a>
      )}
    </motion.div>
  );
}

function NewBenefitModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("Saúde");
  const [icon, setIcon] = useState("🎁");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const selectCls = "mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  async function submit() {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try { await onSubmit({ title, description, details, category, icon, link }); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Novo Benefício</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div>
          <Label className="text-xs">Ícone</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setIcon(e)}
                className={cn("text-xl p-1.5 rounded-lg transition-all hover:scale-110",
                  icon === e ? "bg-primary/20 ring-2 ring-primary/50 scale-110" : "hover:bg-muted")}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div><Label className="text-xs">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus /></div>
        <div><Label className="text-xs">Categoria</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><Label className="text-xs">Descrição resumida *</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Resumo do benefício em 1-2 linhas..." className="mt-1 resize-none" rows={2} /></div>
        <div><Label className="text-xs">Detalhes completos</Label><Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Regras, como usar, validade, limites..." className="mt-1 resize-none" rows={4} /></div>
        <div><Label className="text-xs">Link do portal (opcional)</Label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="mt-1 h-9" /></div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !description.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar benefício 🎁"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function BeneficiosPage() {
  const pathname = usePathname();
  const { benefits, loading, createBenefit, deleteBenefit } = useBeneficios();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("Todos");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canManage = myRole === "admin" || myRole === "rh";

  const grouped = useMemo(() => {
    const list = filter === "Todos" ? benefits : benefits.filter((b) => b.category === filter);
    return CATEGORIES.reduce((acc, cat) => {
      const items = list.filter((b) => b.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    }, {} as Record<string, Benefit[]>);
  }, [benefits, filter]);

  async function handleDelete(id: string) {
    try { await deleteBenefit(id); toast.success("Benefício removido."); }
    catch { toast.error("Erro ao remover."); }
  }

  let globalIndex = 0;

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><Gift className="w-5 h-5 text-primary" />Benefícios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Plano de saúde, vale-refeição, convênios e muito mais</p>
          </div>
          {canManage && <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0"><Plus className="w-4 h-4" />Novo</Button>}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {["Todos", ...CATEGORIES].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🎁</p>
            <p className="font-medium">Nenhum benefício cadastrado</p>
            {canManage && <p className="text-sm text-muted-foreground">Clique em "Novo" para adicionar.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{cat}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((b) => <BenefitCard key={b.id} benefit={b} canManage={canManage} onDelete={handleDelete} index={globalIndex++} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <NewBenefitModal onSubmit={createBenefit} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
