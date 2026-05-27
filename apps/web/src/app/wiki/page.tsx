"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useWiki } from "@/lib/hooks/useWiki";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { RichTextContent } from "@/components/ui/RichTextContent";
import {
  Plus, Loader2, Search, BookMarked, X, Pencil, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { WikiArticle } from "@/types";

const CATEGORIES = ["FAQ", "Tutorial", "Processo", "Política", "Outros"];
const CAT_COLORS: Record<string, string> = {
  "FAQ":      "bg-blue-500/15 text-blue-400",
  "Tutorial": "bg-emerald-500/15 text-emerald-400",
  "Processo": "bg-purple-500/15 text-purple-400",
  "Política": "bg-amber-500/15 text-amber-400",
  "Outros":   "bg-muted text-muted-foreground",
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days < 30) return `${days}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function ArticleCard({ article, canManage, onEdit, onDelete, index }: {
  article: WikiArticle; canManage: boolean;
  onEdit: (a: WikiArticle) => void; onDelete: (id: string) => void; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const catCls = CAT_COLORS[article.category] ?? CAT_COLORS["Outros"];
  const author = article.expand?.author;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-border/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", catCls)}>{article.category}</span>
            {article.tags && article.tags.split(",").slice(0, 2).map((t) => (
              <span key={t} className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{t.trim()}</span>
            ))}
          </div>
          <Link href={`/wiki/${article.id}`} prefetch={false}
            className="font-semibold text-sm hover:text-primary transition-colors">
            {article.title}
          </Link>
        </div>
        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(article)} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Pencil style={{ width: 13, height: 13 }} />
            </button>
            <button onClick={() => onDelete(article.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 transition-colors">
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}
      </div>

      {!expanded && (
        <RichTextContent html={article.content} className="line-clamp-2 text-muted-foreground" />
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline flex items-center gap-1">
          {expanded ? <><ChevronUp style={{ width: 12, height: 12 }} />Recolher</> : <><ChevronDown style={{ width: 12, height: 12 }} />Ler artigo</>}
        </button>
      </div>

      {expanded && (
        <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
          <RichTextContent html={article.content} />
        </div>
      )}

      {author && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <UserAvatar user={author} size="sm" />
          <span className="text-xs text-muted-foreground">{author.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">Atualizado {timeAgo(article.updated || article.created)}</span>
        </div>
      )}
    </motion.div>
  );
}

function ArticleModal({ article, onSubmit, onClose }: {
  article?: WikiArticle; onSubmit: (d: any) => Promise<void>; onClose: () => void;
}) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [category, setCategory] = useState(article?.category ?? "FAQ");
  const [tags, setTags] = useState(article?.tags ?? "");
  const [loading, setLoading] = useState(false);
  const selectCls = "mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  async function submit() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title, content, category, tags });
      onClose();
    } catch (err) {
      console.error("[ArticleModal] submit failed:", err);
      toast.error("Erro ao salvar artigo.");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{article ? "Editar artigo" : "Novo artigo"}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Categoria</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Tags (vírgula)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: senha, acesso" className="mt-1 h-9" /></div>
        </div>
        <div><Label className="text-xs">Conteúdo *</Label>
          <RichTextEditor value={content} onChange={setContent}
            placeholder="Escreva o artigo aqui..."
            className="mt-1" minHeight={200} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !content.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : article ? "Salvar" : "Publicar artigo 📚"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WikiPage() {
  const pathname = usePathname();
  const { articles, loading, createArticle, updateArticle, deleteArticle } = useWiki();
  const [showModal, setShowModal] = useState(false);
  const [editArticle, setEditArticle] = useState<WikiArticle | null>(null);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canManage = myRole === "admin" || myRole === "rh";

  const filtered = useMemo(() =>
    articles.filter((a) => (filter === "Todos" || a.category === filter) &&
      (!search.trim() || a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase()) ||
        a.tags?.toLowerCase().includes(search.toLowerCase())))
  , [articles, filter, search]);

  async function handleDelete(id: string) {
    try { await deleteArticle(id); toast.success("Artigo removido."); }
    catch { toast.error("Erro ao remover."); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><BookMarked className="w-5 h-5 text-primary" />Wiki Corporativa</h1>
            <p className="text-sm text-muted-foreground mt-0.5">FAQ, tutoriais, processos e guias internos</p>
          </div>
          {canManage && <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0"><Plus className="w-4 h-4" />Novo artigo</Button>}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar artigos, tags..." className="pl-9 h-9" />
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

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">📚</p>
              <p className="font-medium">Nenhum artigo encontrado</p>
              {canManage && <p className="text-sm text-muted-foreground">Clique em "Novo artigo" para criar.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => (
                <ArticleCard key={a.id} article={a} canManage={canManage} index={i}
                  onEdit={(art) => setEditArticle(art)} onDelete={handleDelete} />
              ))}
            </div>
          )
        }
      </div>

      <AnimatePresence>
        {showModal && <ArticleModal onSubmit={createArticle} onClose={() => setShowModal(false)} />}
        {editArticle && (
          <ArticleModal article={editArticle}
            onSubmit={(d) => updateArticle(editArticle.id, d)}
            onClose={() => setEditArticle(null)} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
