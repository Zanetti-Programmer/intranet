"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useArticles } from "@/lib/hooks/useArticles";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { WhoIsOnlineCard } from "@/components/widgets/WhoIsOnlineCard";
import { CommentSection } from "@/components/feed/CommentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { CardSkeleton } from "@/components/ui/skeleton";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Plus, Loader2, Search, BookOpen, X, Image as ImageIcon, Trash2, Eye, Pencil, Check, ExternalLink, Heart, MessageCircle, Share2 } from "lucide-react";
import { useBlogLike } from "./useBlogLike";
import getPocketBase from "@/lib/pocketbase";
import { cn, pbFileUrl } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import type { Article } from "@/types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}


const WEATHER_CACHE_KEY = "weather-cache";
const WEATHER_TTL = 30 * 60 * 1000; // 30 min — evita 1 req por usuário por abertura

// ── Weather widget ─────────────────────────────────────────────────────────────
function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: string; desc: string; emoji: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEATHER_CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < WEATHER_TTL) { setWeather(data); return; }
      }
    } catch {}

    fetch("https://wttr.in/?format=j1")
      .then((r) => r.json())
      .then((data) => {
        const c = data.current_condition[0];
        const code = parseInt(c.weatherCode);
        let emoji = "🌤️";
        if (code === 113) emoji = "☀️";
        else if (code <= 119) emoji = "⛅";
        else if (code <= 143) emoji = "🌫️";
        else if (code <= 260) emoji = "🌧️";
        else if (code <= 350) emoji = "🌧️";
        else if (code <= 395) emoji = "❄️";
        const w = { temp: c.temp_C, desc: c.weatherDesc[0].value, emoji };
        setWeather(w);
        try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data: w, ts: Date.now() })); } catch {}
      })
      .catch(() => {});
  }, []);

  if (!weather) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Clima</p>
          <p className="text-3xl font-bold leading-none">{weather.temp}°C</p>
          <p className="text-sm text-muted-foreground mt-1.5 leading-tight">{weather.desc}</p>
        </div>
        <span className="text-5xl">{weather.emoji}</span>
      </div>
    </div>
  );
}

// ── Groups sidebar card ────────────────────────────────────────────────────────
function GroupsSidebarCard() {
  const { spaces } = useSpaces();
  if (!spaces.length) return null;
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border/60">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Grupos</p>
      </div>
      <div className="divide-y divide-border/40">
        {spaces.slice(0, 5).map((s) => (
          <Link key={s.id} href={`/?space=${s.id}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
            <span className="text-lg w-7 text-center">{s.icon}</span>
            <span className="text-sm font-medium truncate flex-1">{s.name}</span>
          </Link>
        ))}
      </div>
      <div className="border-t border-border/60">
        <Link href="/grupos" className="flex items-center justify-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
          Ver todos os grupos →
        </Link>
      </div>
    </div>
  );
}

// ── Latest Announcements sidebar card ─────────────────────────────────────────
function AnnouncementsSidebarCard() {
  const { announcements } = useAnnouncements();
  const recent = announcements.slice(0, 4);
  if (!recent.length) return null;
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border/60">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Avisos recentes</p>
      </div>
      <div className="divide-y divide-border/40">
        {recent.map((a) => (
          <Link key={a.id} href="/avisos"
            className="flex items-start gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors group">
            <span className={cn("text-[10px] font-bold uppercase mt-0.5 shrink-0",
              a.priority === "urgent" ? "text-red-400" : a.priority === "high" ? "text-amber-400" : "text-primary")}>
              {a.priority === "urgent" ? "🚨" : a.priority === "high" ? "⚠️" : "📢"}
            </span>
            <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">{a.title}</p>
          </Link>
        ))}
      </div>
      <div className="border-t border-border/60">
        <Link href="/avisos" className="flex items-center justify-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
          Ver todos os avisos →
        </Link>
      </div>
    </div>
  );
}

// ── Blog post card ─────────────────────────────────────────────────────────────
function BlogCard({ article, canManage, onDelete, onPublish, onUpdate, index }: {
  article: Article; canManage: boolean; index: number;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onUpdate: (id: string, data: { title: string; content: string; tags: string; status: "published" | "draft" }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editContent, setEditContent] = useState(article.content);
  const [editTags, setEditTags] = useState(article.tags ?? "");
  const router = useRouter();
  const { liked, count: likeCount, toggle: toggleLike } = useBlogLike(article.id);
  const author = article.expand?.author;
  const coverUrl = article.cover ? pbFileUrl("articles", article.id, article.cover, "600x300") : null;
  const pb = getPocketBase();
  const myId = pb.authStore.record?.id;
  const myRole = (pb.authStore.record as { role?: string })?.role;
  // Delete: only own article or admin (matches backend deleteRule)
  const canDelete = article.author === myId || myRole === "admin";
  const excerpt = article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("post_comments").getList(1, 1, { filter: `post = "${article.id}"` })
      .then((r) => setCommentCount(r.totalItems)).catch(() => {});
  }, [article.id]);

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await onUpdate(article.id, { title: editTitle.trim(), content: editContent.trim(), tags: editTags.trim(), status: article.status });
      setEditing(false);
      toast.success("Post atualizado.");
    } catch { toast.error("Erro ao atualizar."); }
    finally { setSaving(false); }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.origin + `/blog/${article.id}`)
      .then(() => toast.success("Link copiado!")).catch(() => {});
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className={cn("bg-card border border-border rounded-2xl overflow-hidden hover:border-border/60 transition-colors",
        article.status === "draft" && "border-amber-500/30 bg-amber-500/5")}>
      {coverUrl && !editing && (
        <div className="relative h-48 cursor-pointer" onClick={() => router.push(`/blog/${article.id}`)}>
          <img src={coverUrl} alt={article.title} className="w-full h-full object-cover" />
          {(canManage || canDelete) && (
            <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
              {canManage && article.status === "draft" && (
                <button onClick={() => onPublish(article.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-emerald-500 transition-colors">
                  <Eye style={{ width: 13, height: 13 }} />
                </button>
              )}
              {canManage && (
                <button onClick={() => { setEditing(true); setEditTitle(article.title); setEditContent(article.content); setEditTags(article.tags ?? ""); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-primary transition-colors">
                  <Pencil style={{ width: 13, height: 13 }} />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(article.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors">
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Tags + admin actions (no cover) */}
        {!coverUrl && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {article.status === "draft" && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Rascunho</span>
              )}
              {article.tags?.split(",").slice(0, 2).map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
            {(canManage || canDelete) && !editing && (
              <div className="flex items-center gap-1 shrink-0">
                {canManage && article.status === "draft" && (
                  <button onClick={() => onPublish(article.id)} title="Publicar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                    <Eye style={{ width: 13, height: 13 }} />
                  </button>
                )}
                {canManage && (
                  <button onClick={() => { setEditing(true); setEditTitle(article.title); setEditContent(article.content); setEditTags(article.tags ?? ""); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary transition-colors">
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => onDelete(article.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tags when has cover */}
        {coverUrl && (
          <div className="flex items-center gap-2 flex-wrap">
            {article.tags?.split(",").slice(0, 2).map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>
        )}

        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título</Label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
            </div>
            <div>
              <Label className="text-xs">Conteúdo</Label>
              <RichTextEditor value={editContent} onChange={setEditContent} className="mt-1" minHeight={150} />
            </div>
            <div>
              <Label className="text-xs">Tags (vírgula)</Label>
              <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="ex: cultura, tech"
                className="mt-1 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => void handleSave()} disabled={saving || !editTitle.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Check style={{ width: 12, height: 12 }} /> {saving ? "Salvando..." : "Salvar"}
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors">
                <X style={{ width: 12, height: 12 }} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-base leading-snug cursor-pointer hover:text-primary transition-colors"
              onClick={() => router.push(`/blog/${article.id}`)}>
              {article.title}
            </h3>
            {!expanded && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {excerpt}{excerpt.length >= 180 ? "…" : ""}
              </p>
            )}
            {expanded && (
              <div className="bg-muted/20 rounded-xl p-4 border border-border/40">
                {isHtml
                  ? <RichTextContent html={article.content} className="text-sm leading-relaxed" />
                  : <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{article.content}</p>
                }
              </div>
            )}
          </>
        )}

        {!editing && (
          <>
            {/* Author row */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              {author && <UserAvatar user={author} size="sm" />}
              <span className="text-xs text-muted-foreground font-medium">{author?.name}</span>
              <span className="text-xs text-muted-foreground/60 ml-auto">{formatDate(article.created)}</span>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-1 -mx-1">
              <button onClick={() => void toggleLike()}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  liked ? "text-red-500 bg-red-500/8" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <Heart style={{ width: 13, height: 13 }} className={cn(liked && "fill-red-500")} />
                {likeCount > 0 ? likeCount : "Curtir"}
              </button>
              <button onClick={() => setCommentsOpen((v) => !v)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  commentsOpen ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <MessageCircle style={{ width: 13, height: 13 }} /> Comentar{commentCount > 0 ? ` (${commentCount})` : ""}
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Share2 style={{ width: 13, height: 13 }} /> Compartilhar
              </button>
              <button onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto px-1">
                {expanded ? "Recolher" : "Ler mais"}
              </button>
              <button onClick={() => router.push(`/blog/${article.id}`)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-1">
                <ExternalLink style={{ width: 11, height: 11 }} />
              </button>
            </div>

            {/* Inline comments */}
            <CommentSection postId={article.id} open={commentsOpen} />
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── New Blog Modal ─────────────────────────────────────────────────────────────
function NewBlogModal({ onSubmit, onClose }: {
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

  const contentText = content.replace(/<[^>]+>/g, "").trim();

  async function submit() {
    if (!title.trim() || !contentText) return;
    setLoading(true);
    try { await onSubmit({ title, content, tags, status, coverFile: coverFile ?? undefined }); onClose(); }
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
          <RichTextEditor value={content} onChange={setContent}
            placeholder="Compartilhe seus aprendizados..."
            className="mt-1" minHeight={160} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Tags (vírgula)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: cultura, tech" className="mt-1 h-9" /></div>
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
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={() => void submit()} disabled={!title.trim() || !contentText || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar ✍️"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const pathname = usePathname();
  const { articles, loading, createArticle, deleteArticle, publishArticle, updateArticle, canSeeDrafts } = useArticles("blog");
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
      <div className="max-w-[1200px] mx-auto px-5 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Blog Corporativo
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Aprendizados, cases e cultura da empresa</p>
          </div>
          {canCreate && <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Novo post</Button>}
        </div>

        {/* ── 3-col layout ── */}
        <div className="flex gap-6 items-start">

          {/* Left sidebar */}
          <div className="hidden xl:flex flex-col gap-5 w-[220px] shrink-0">
            <WeatherWidget />
            <GroupsSidebarCard />
          </div>

          {/* Main feed */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Search + filters */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar posts..." className="pl-9 h-9" />
              </div>
              {canSeeDrafts && (
                <div className="flex gap-1.5">
                  {[["published", "Publicados"], ["draft", "Rascunhos"], ["all", "Todos"]].map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v as typeof filter)}
                      className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                        filter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Post list */}
            {loading ? (
              <div className="space-y-4">{Array.from({length:4}).map((_,i)=><CardSkeleton key={i}/>)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-4xl">✍️</p>
                <p className="font-medium">Nenhum post encontrado</p>
                {canCreate && <p className="text-sm text-muted-foreground">Clique em "Novo post" para começar.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((a, i) => (
                  <BlogCard key={a.id} article={a} canManage={canSeeDrafts} index={i}
                    onDelete={handleDelete} onPublish={publishArticle} onUpdate={updateArticle} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:flex flex-col gap-5 w-[240px] shrink-0">
            <AnnouncementsSidebarCard />
            <WhoIsOnlineCard />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <NewBlogModal onSubmit={createArticle} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
