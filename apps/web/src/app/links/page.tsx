"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useLinks } from "@/lib/hooks/useLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Search, Link2, ExternalLink, Trash2, X } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UsefulLink } from "@/types";

const CATEGORIES = ["ERP", "E-mail", "Drive", "RH", "Financeiro", "TI", "Comunicação", "Outros"];
const CAT_COLORS: Record<string, string> = {
  "ERP":        "bg-orange-500/15 text-orange-400",
  "E-mail":     "bg-blue-500/15 text-blue-400",
  "Drive":      "bg-yellow-500/15 text-yellow-400",
  "RH":         "bg-pink-500/15 text-pink-400",
  "Financeiro": "bg-emerald-500/15 text-emerald-400",
  "TI":         "bg-indigo-500/15 text-indigo-400",
  "Comunicação":"bg-purple-500/15 text-purple-400",
  "Outros":     "bg-muted text-muted-foreground",
};

const DEFAULT_EMOJIS = ["🔗","📧","💼","📊","🖥️","💰","📁","🔧","📱","🌐","⚙️","📝"];

function LinkCard({ link, canManage, onDelete, index }: {
  link: UsefulLink; canManage: boolean; onDelete: (id: string) => void; index: number;
}) {
  const catCls = CAT_COLORS[link.category] ?? CAT_COLORS["Outros"];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}
      className="group bg-card border border-border rounded-2xl p-4 flex items-start gap-3 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
      onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}>
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0", catCls)}>
        {link.icon || "🔗"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{link.title}</h3>
          <ExternalLink style={{ width: 11, height: 11 }} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {link.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{link.description}</p>}
        <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-1.5", catCls)}>
          {link.category}
        </span>
      </div>
      {canManage && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition-colors shrink-0 opacity-0 group-hover:opacity-100">
          <Trash2 style={{ width: 13, height: 13 }} />
        </button>
      )}
    </motion.div>
  );
}

function NewLinkModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ERP");
  const [icon, setIcon] = useState("🔗");
  const [loading, setLoading] = useState(false);
  const selectCls = "mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  async function submit() {
    if (!title.trim() || !url.trim()) return;
    const finalUrl = url.startsWith("http") ? url : `https://${url}`;
    setLoading(true);
    try { await onSubmit({ title, url: finalUrl, description, category, icon }); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Novo Link</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div>
          <Label className="text-xs">Ícone</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {DEFAULT_EMOJIS.map((e) => (
              <button key={e} onClick={() => setIcon(e)}
                className={cn("text-xl p-1.5 rounded-lg transition-all hover:scale-110",
                  icon === e ? "bg-primary/20 ring-2 ring-primary/50 scale-110" : "hover:bg-muted")}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div><Label className="text-xs">Nome *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Portal do RH" className="mt-1 h-9" autoFocus /></div>
        <div><Label className="text-xs">URL *</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1 h-9" /></div>
        <div><Label className="text-xs">Categoria</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><Label className="text-xs">Descrição (opcional)</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que serve este sistema..." className="mt-1 h-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !url.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Adicionar link 🔗"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function LinksPage() {
  const pathname = usePathname();
  const { links, loading, createLink, deleteLink } = useLinks();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canManage = myRole === "admin";

  const filtered = useMemo(() =>
    links.filter((l) => !search.trim() ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase()))
  , [links, search]);

  const grouped = useMemo(() =>
    CATEGORIES.reduce((acc, cat) => {
      const items = filtered.filter((l) => l.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    }, {} as Record<string, UsefulLink[]>)
  , [filtered]);

  async function handleDelete(id: string) {
    try { await deleteLink(id); toast.success("Link removido."); }
    catch { toast.error("Erro ao remover."); }
  }

  let globalIndex = 0;

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" />Links Úteis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Atalhos para todos os sistemas da empresa</p>
          </div>
          {canManage && <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0"><Plus className="w-4 h-4" />Novo link</Button>}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar sistemas..." className="pl-9 h-9" />
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🔗</p>
              <p className="font-medium">Nenhum link cadastrado</p>
              {canManage && <p className="text-sm text-muted-foreground">Clique em "Novo link" para adicionar.</p>}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{cat}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((l) => <LinkCard key={l.id} link={l} canManage={canManage} onDelete={handleDelete} index={globalIndex++} />)}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
      <AnimatePresence>
        {showModal && <NewLinkModal onSubmit={createLink} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
