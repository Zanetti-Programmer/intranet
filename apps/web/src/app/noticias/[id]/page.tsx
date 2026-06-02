"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../layout-dashboard";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CommentSection } from "@/components/feed/CommentSection";
import { useBlogLike } from "@/app/blog/useBlogLike";
import getPocketBase from "@/lib/pocketbase";
import { pbFileUrl } from "@/lib/utils";
import { ArrowLeft, Loader2, Trash2, Heart, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Article } from "@/types";

export default function NoticiaPage() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canDelete = myRole === "admin" || myRole === "rh";

  const { liked, count: likeCount, toggle: toggleLike } = useBlogLike(id);

  useEffect(() => {
    if (!id) return;
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("articles").getOne(id, { expand: "author" })
      .then((r) => setArticle(r as unknown as Article))
      .catch(() => router.push("/noticias"))
      .finally(() => setLoading(false));
    pb.collection("post_comments").getList(1, 1, { filter: `post = "${id}"` })
      .then((r) => setCommentCount(r.totalItems)).catch(() => {});
  }, [id, router]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Link copiado!")).catch(() => {});
  }

  async function handleDelete() {
    if (!article || !confirm("Excluir esta notícia?")) return;
    try {
      await getPocketBase().collection("articles").delete(article.id);
      toast.success("Notícia removida.");
      router.push("/noticias");
    } catch { toast.error("Erro ao remover."); }
  }

  if (loading) {
    return (
      <DashboardLayout pathname={pathname}>
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  if (!article) return null;

  const author = article.expand?.author;
  const coverUrl = article.cover ? pbFileUrl("articles", article.id, article.cover, "1200x500") : null;
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);
  const pubDate = new Date(article.created).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6">
        <button onClick={() => router.push("/noticias")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para Notícias
        </button>

        <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {article.status === "draft" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Rascunho</span>
            )}
            {article.tags?.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-tight mb-3">{article.title}</h1>

          {/* Author + date */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              {author && <UserAvatar user={author} size="sm" />}
              <div>
                <p className="text-sm font-medium">{author?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{pubDate}</p>
              </div>
            </div>
            {canDelete && (
              <button onClick={() => void handleDelete()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 style={{ width: 13, height: 13 }} /> Excluir
              </button>
            )}
          </div>

          {/* Cover */}
          {coverUrl && (
            <div className="rounded-2xl overflow-hidden mb-6">
              <img src={coverUrl} alt={article.title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          {/* Content */}
          <div className="prose-intranet">
            {isHtml
              ? <RichTextContent html={article.content} className="text-base leading-relaxed" />
              : <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{article.content}</p>
            }
          </div>

          {/* Actions */}
          <div className="mt-6 border-t border-border pt-4 flex items-center gap-5">
            <button onClick={() => void toggleLike()}
              className={cn("flex items-center gap-1.5 text-sm transition-colors",
                liked ? "text-red-500" : "text-muted-foreground hover:text-foreground")}>
              <Heart className={cn("w-4 h-4", liked && "fill-red-500")} strokeWidth={1.8} />
              Curtir{likeCount > 0 ? ` ${likeCount}` : ""}
            </button>
            <button onClick={() => setCommentsOpen((v) => !v)}
              className={cn("flex items-center gap-1.5 text-sm transition-colors",
                commentsOpen ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
              Comentar{commentCount > 0 ? ` (${commentCount})` : ""}
            </button>
            <button onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="w-4 h-4" strokeWidth={1.8} /> Compartilhar
            </button>
          </div>

          {/* Comments */}
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm font-semibold mb-4">
              Comentários{commentCount > 0 ? ` (${commentCount})` : ""}
            </p>
            <CommentSection postId={article.id} open={true} canDeleteAny={canDelete}
              onCommentAdded={() => setCommentCount((c) => c + 1)} />
          </div>
        </motion.article>
      </div>
    </DashboardLayout>
  );
}
