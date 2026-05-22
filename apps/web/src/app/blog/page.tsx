"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useArticles } from "@/lib/hooks/useArticles";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Search, BookOpen, X, ChevronDown, ChevronUp, Image as ImageIcon, Trash2, Eye } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn, pbFileUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Article } from "@/types";

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days < 30) return `${days}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function BlogCard({ article, canManage, onDelete, onPublish, index }: {
  article: Article; canManage: boolean;
  onDelete: (id: string) => void; onPublish: (id: string) => void; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const author = article.expand?.author;
  const coverUrl = article.cover ? pbFileUrl("articles", article.id, article.cover, "600x300") : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className={cn("bg-card border border-border rounded-2xl overflow-hidden hover:border-border/60 transition-colors",
        article.status === "draft" && "border-amber-500/30 bg-amber-500/5")}>
      {coverUrl && <img src={coverUrl} alt={article.title} className="w-full h-40 object-cover" />}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {article.status === "draft" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Rascunho</span>
            )}
            {article.tags?.split(",").slice(0, 2).map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              {article.status === "draft" && (
                <button onClick={() => onPublish(article.id)} title="Publicar"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  <Eye style={{ width: 13, height: 13 }} />
                </button>
              )}
              <button onClick={() => onDelete(article.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-snug cursor-pointer hover:text-primary transition-colors"
          onClick={() => setExpanded(!expanded)}>
          {article.title}
        </h3>

        <p className={cn("text-sm text-muted-foreground leading-relaxed", !expanded && "line-clamp-3")}>
          {article.content}
        </p>

        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline flex items-center gap-1">
          {expanded ? <><ChevronUp style={{ width: 12, height: 12 }} />Recolher</> : <><ChevronDown style={{ width: 12, height: 12 }} />Ler completo</>}
        </button>

        {author && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <UserAvatar user={author} size="sm" />
            <span className="text-xs text-muted-foreground">{author.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">{timeAgo(article.created)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NewBlogModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try { await onSubmit({ title, content, tags, status, coverFile }); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Novo post no Blog</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus /></div>
        <div><Label className="text-xs">Conteúdo *</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Compartilhe seus aprendizados..." className="mt-1 resize-none min-h-[160px]" rows={7} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Tags (vírgula)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: cultura, tech" className="mt-1 h-9" /></div>
          <div><Label className="text-xs">Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "published"|"draft")}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              <option value="published">Publicar agora</option>
              <option value="draft">Salvar rascunho</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Imagem de capa (opcional)</Label>
          <div onClick={() => fileRef.current?.click()}
            className="mt-1 border border-dashed border-border rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <ImageIcon style={{ width: 16, height: 16 }} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{coverFile ? coverFile.name : "Selecionar imagem..."}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !content.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar ✍️"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function BlogPage() {
  const pathname = usePathname();
  const { articles, loading, createArticle, deleteArticle, publishArticle, canSeeDrafts } = useArticles("blog");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"published" | "draft" | "all">("published");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canCreate = myRole === "admin" || myRole === "rh" || myRole === "ti";

  const filtered = useMemo(() =>
    articles.filter((a) => (filter === "all" || a.status === filter) &&
      (!search.trim() || a.title.toLowerCase().includes(search.toLowerCase())))
  , [articles, filter, search]);

  async function handleDelete(id: string) {
    try { await deleteArticle(id); toast.success("Post removido."); }
    catch { toast.error("Erro ao remover."); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Blog Corporativo</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Aprendizados, cases e cultura da empresa</p>
          </div>
          {canCreate && <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0"><Plus className="w-4 h-4" />Novo post</Button>}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar posts..." className="pl-9 h-9" />
        </div>

        {canSeeDrafts && (
          <div className="flex gap-1.5">
            {[["published","Publicados"],["draft","Rascunhos"],["all","Todos"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v as typeof filter)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  filter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>
        )}

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">✍️</p>
              <p className="font-medium">Nenhum post encontrado</p>
              {canCreate && <p className="text-sm text-muted-foreground">Clique em "Novo post" para começar.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a, i) => (
                <BlogCard key={a.id} article={a} canManage={canSeeDrafts} index={i}
                  onDelete={handleDelete} onPublish={publishArticle} />
              ))}
            </div>
          )}
      </div>
      <AnimatePresence>
        {showModal && <NewBlogModal onSubmit={createArticle} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
