"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useArticles } from "@/lib/hooks/useArticles";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Search, X, Image as ImageIcon, Trash2, Eye, Pencil, Check, Clock } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn, pbFileUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Article } from "@/types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (m < 60) return `${m}min atrás`;
  if (h < 24) return `${h}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(d);
}

// ── Hero article (destaque) ───────────────────────────────────────────────────
function HeroArticle({ article, canManage, onDelete, onPublish }: {
  article: Article; canManage: boolean;
  onDelete: (id: string) => void; onPublish: (id: string) => void;
}) {
  const router = useRouter();
  const author = article.expand?.author;
  const coverUrl = article.cover
    ? pbFileUrl("articles", article.id, article.cover, "1200x600")
    : null;
  const tags = article.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden bg-card border border-border group cursor-pointer"
      onClick={() => router.push(`/noticias/${article.id}`)}>
      {/* Cover image or gradient */}
      <div className="relative h-72 sm:h-96 bg-gradient-to-br from-primary/20 via-primary/5 to-background">
        {coverUrl && (
          <img src={coverUrl} alt={article.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
            Destaque
          </span>
          {article.status === "draft" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/90 text-white">Rascunho</span>
          )}
          {tags[0] && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">{tags[0]}</span>
          )}
        </div>

        {/* Admin actions */}
        {canManage && (
          <div className="absolute top-4 right-4 flex gap-1" onClick={(e) => e.stopPropagation()}>
            {article.status === "draft" && (
              <button onClick={() => onPublish(article.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500 transition-colors">
                <Eye style={{ width: 13, height: 13 }} />
              </button>
            )}
            <button onClick={() => onDelete(article.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 text-white hover:bg-red-600 transition-colors">
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-3 group-hover:text-primary/90 transition-colors">
            {article.title}
          </h2>
          <div className="flex items-center gap-3">
            {author && <UserAvatar user={author} size="sm" className="ring-2 ring-white/30" />}
            <span className="text-white/80 text-xs font-medium">{author?.name}</span>
            <span className="text-white/50 text-xs flex items-center gap-1">
              <Clock style={{ width: 10, height: 10 }} /> {timeAgo(article.created)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Medium card (2ª e 3ª notícias) ───────────────────────────────────────────
function MediumCard({ article, canManage, onDelete, onPublish, index }: {
  article: Article; canManage: boolean; index: number;
  onDelete: (id: string) => void; onPublish: (id: string) => void;
}) {
  const router = useRouter();
  const author = article.expand?.author;
  const coverUrl = article.cover ? pbFileUrl("articles", article.id, article.cover, "600x300") : null;
  const tags = article.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);
  const excerpt = isHtml
    ? article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
    : article.content.slice(0, 120);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className={cn("group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors cursor-pointer flex flex-col",
        article.status === "draft" && "border-amber-500/30 bg-amber-500/5")}
      onClick={() => router.push(`/noticias/${article.id}`)}>
      <div className="relative h-40 bg-muted">
        {coverUrl
          ? <img src={coverUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400" />
          : <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <span className="text-4xl opacity-30">📰</span>
            </div>
        }
        {/* Actions overlay */}
        {canManage && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {article.status === "draft" && (
              <button onClick={() => onPublish(article.id)}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-emerald-500/90 text-white hover:bg-emerald-500 transition-colors">
                <Eye style={{ width: 11, height: 11 }} />
              </button>
            )}
            <button onClick={() => onDelete(article.id)}
              className="w-6 h-6 flex items-center justify-center rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors">
              <Trash2 style={{ width: 11, height: 11 }} />
            </button>
          </div>
        )}
        {tags[0] && (
          <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
            {tags[0]}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">{excerpt}{excerpt.length >= 120 ? "…" : ""}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          {author && <UserAvatar user={author} size="sm" />}
          <span className="text-[11px] text-muted-foreground">{author?.name}</span>
          <span className="text-[10px] text-muted-foreground/60 ml-auto flex items-center gap-1">
            <Clock style={{ width: 9, height: 9 }} /> {timeAgo(article.created)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Compact list item (demais notícias) ───────────────────────────────────────
function CompactItem({ article, canManage, onDelete, onPublish, index }: {
  article: Article; canManage: boolean; index: number;
  onDelete: (id: string) => void; onPublish: (id: string) => void;
}) {
  const router = useRouter();
  const author = article.expand?.author;
  const coverUrl = article.cover ? pbFileUrl("articles", article.id, article.cover, "200x200") : null;
  const tags = article.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);
  const excerpt = isHtml
    ? article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100)
    : article.content.slice(0, 100);

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      className={cn("group flex gap-4 py-4 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/20 rounded-xl px-3 -mx-3 transition-colors",
        article.status === "draft" && "opacity-70")}
      onClick={() => router.push(`/noticias/${article.id}`)}>
      {/* Thumbnail */}
      <div className="w-20 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
        {coverUrl
          ? <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <span className="text-xl opacity-30">📰</span>
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {article.status === "draft" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Rascunho</span>
          )}
          {tags[0] && <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">{tags[0]}</span>}
        </div>
        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
          {article.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1">{excerpt}{excerpt.length >= 100 ? "…" : ""}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/70">{author?.name}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[10px] text-muted-foreground/70">{timeAgo(article.created)}</span>
          {canManage && (
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              {article.status === "draft" && (
                <button onClick={() => onPublish(article.id)}
                  className="w-5 h-5 flex items-center justify-center rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  <Eye style={{ width: 11, height: 11 }} />
                </button>
              )}
              <button onClick={() => onDelete(article.id)}
                className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 style={{ width: 11, height: 11 }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── New Article Modal ─────────────────────────────────────────────────────────
function NewArticleModal({ onSubmit, onClose }: {
  onSubmit: (d: { title: string; content: string; tags: string; status: string; coverFile?: File }) => Promise<void>;
  onClose: () => void;
}) {
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
    try { await onSubmit({ title, content, tags, status, coverFile: coverFile ?? undefined }); onClose(); }
    catch { toast.error("Erro ao publicar."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nova notícia</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus />
        </div>
        <div><Label className="text-xs">Conteúdo *</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o conteúdo completo..." className="mt-1 resize-none min-h-[160px]" rows={7} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Tags (vírgula)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: rh, evento" className="mt-1 h-9" />
          </div>
          <div><Label className="text-xs">Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "published" | "draft")}
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
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={() => void submit()} disabled={!title.trim() || !content.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar 📰"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Edit modal (inline) ───────────────────────────────────────────────────────
function EditModal({ article, onSave, onClose }: {
  article: Article;
  onSave: (id: string, data: { title: string; content: string; tags: string; status: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [tags, setTags] = useState(article.tags ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try { await onSave(article.id, { title: title.trim(), content, tags, status: article.status }); onClose(); toast.success("Notícia atualizada."); }
    catch { toast.error("Erro ao salvar."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Editar notícia</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9" autoFocus />
        </div>
        <div><Label className="text-xs">Conteúdo *</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 resize-none min-h-[160px]" rows={7} />
        </div>
        <div><Label className="text-xs">Tags (vírgula)</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: rh, evento" className="mt-1 h-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={() => void save()} disabled={!title.trim() || saving} className="flex-1 h-9 gap-1.5">
            <Check className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NoticiasPage() {
  const pathname = usePathname();
  const { articles, loading, createArticle, deleteArticle, publishArticle, updateArticle, canSeeDrafts } = useArticles("news");
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("Todas");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canCreate = myRole === "admin" || myRole === "rh";

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    articles.forEach((a) => a.tags?.split(",").forEach((t) => { const tt = t.trim(); if (tt) tags.add(tt); }));
    return ["Todas", ...Array.from(tags)];
  }, [articles]);

  const filtered = useMemo(() => {
    return articles
      .filter((a) => canSeeDrafts || a.status === "published")
      .filter((a) => activeTag === "Todas" || a.tags?.toLowerCase().includes(activeTag.toLowerCase()))
      .filter((a) => !search.trim() ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.tags?.toLowerCase().includes(search.toLowerCase()));
  }, [articles, canSeeDrafts, activeTag, search]);

  async function handleDelete(id: string) {
    try { await deleteArticle(id); toast.success("Notícia removida."); }
    catch { toast.error("Erro ao remover."); }
  }

  const hero = filtered[0] ?? null;
  const featured = filtered.slice(1, 3);
  const rest = filtered.slice(3);

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Portal de Notícias</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Notícias</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Comunicados e novidades da empresa</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Nova notícia
            </Button>
          )}
        </div>

        {/* ── Search + tag filters ── */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar notícias..." className="pl-9 h-9" />
          </div>
          {allTags.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {allTags.map((tag) => (
                <button key={tag} onClick={() => setActiveTag(tag)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    activeTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground")}>
                  {tag}
                </button>
              ))}
              {canSeeDrafts && (
                <button onClick={() => setActiveTag("Todas")}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors ml-auto">
                  Ver rascunhos
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-5xl">📰</p>
            <p className="font-semibold text-lg">Nenhuma notícia encontrada</p>
            {canCreate && <p className="text-sm text-muted-foreground">Clique em "Nova notícia" para publicar a primeira.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero */}
            {hero && (
              <div className="relative">
                <HeroArticle article={hero} canManage={canSeeDrafts}
                  onDelete={handleDelete} onPublish={publishArticle} />
                {canSeeDrafts && (
                  <button onClick={(e) => { e.stopPropagation(); setEditingArticle(hero); }}
                    className="absolute top-4 left-32 w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 text-white hover:bg-primary transition-colors z-10">
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            )}

            {/* Featured 2-col grid */}
            {featured.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Mais notícias</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featured.map((a, i) => (
                    <div key={a.id} className="relative">
                      <MediumCard article={a} canManage={canSeeDrafts} index={i}
                        onDelete={handleDelete} onPublish={publishArticle} />
                      {canSeeDrafts && (
                        <button onClick={(e) => { e.stopPropagation(); setEditingArticle(a); }}
                          className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-md bg-black/50 text-white hover:bg-primary transition-colors z-10 opacity-0 hover:opacity-100 group-hover:opacity-100">
                          <Pencil style={{ width: 11, height: 11 }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Compact list */}
            {rest.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Arquivo</h3>
                {rest.map((a, i) => (
                  <div key={a.id} className="relative group/item">
                    <CompactItem article={a} canManage={canSeeDrafts} index={i}
                      onDelete={handleDelete} onPublish={publishArticle} />
                    {canSeeDrafts && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingArticle(a); }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors opacity-0 group-hover/item:opacity-100">
                        <Pencil style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <NewArticleModal onSubmit={createArticle} onClose={() => setShowModal(false)} />}
        {editingArticle && (
          <EditModal article={editingArticle} onSave={updateArticle} onClose={() => setEditingArticle(null)} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
