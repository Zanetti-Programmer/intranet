"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../layout-dashboard";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CommentSection } from "@/components/feed/CommentSection";
import { WhoIsOnlineCard } from "@/components/widgets/WhoIsOnlineCard";
import { useBlogLike } from "@/app/blog/useBlogLike";
import getPocketBase from "@/lib/pocketbase";
import { pbFileUrl } from "@/lib/utils";
import { ArrowLeft, Loader2, MessageCircle, Heart, Share2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Article } from "@/types";

export default function BlogPostPage() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const myId = getPocketBase().authStore.record?.id ?? "";
  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;

  const { liked, count: likeCount, toggle: toggleLike } = useBlogLike(id);

  useEffect(() => {
    if (!id) return;
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("articles").getOne(id, { expand: "author" })
      .then((r) => setArticle(r as unknown as Article))
      .catch(() => router.push("/blog"))
      .finally(() => setLoading(false));

    pb.collection("post_comments").getList(1, 1, { filter: `post = "${id}"` })
      .then((r) => setCommentCount(r.totalItems))
      .catch(() => {});
  }, [id, router]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Link copiado!")).catch(() => {});
  }

  async function handleDelete() {
    if (!article) return;
    try {
      await getPocketBase().collection("articles").delete(article.id);
      toast.success("Post removido.");
      router.push("/blog");
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

  // Delete: own article or admin (mirrors backend deleteRule)
  const canDelete = article.author === myId || myRole === "admin";
  const author = article.expand?.author;
  const coverUrl = article.cover ? pbFileUrl("articles", article.id, article.cover, "1200x500") : null;
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);
  const pubDate = new Date(article.created).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-[1100px] mx-auto px-5 py-6">
        <button onClick={() => router.push("/blog")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Blog
        </button>

        <div className="flex gap-6 items-start">
          {/* Main content */}
          <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {coverUrl && <img src={coverUrl} alt={article.title} className="w-full max-h-72 object-cover" />}
              <div className="p-6 space-y-5">
                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {article.tags?.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">#{t}</span>
                  ))}
                </div>

                <h1 className="text-2xl font-bold leading-tight">{article.title}</h1>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {author && <UserAvatar user={author} size="md" />}
                    <div>
                      <p className="text-sm font-semibold">{author?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{pubDate}</p>
                    </div>
                  </div>
                  {canDelete && !confirmDelete && (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} /> Excluir
                    </button>
                  )}
                  {canDelete && confirmDelete && (
                    <div className="flex items-center gap-2 text-xs">
                      <AlertTriangle style={{ width: 13, height: 13 }} className="text-amber-400" />
                      <span className="text-muted-foreground">Confirmar exclusão?</span>
                      <button
                        onClick={() => void handleDelete()}
                        className="px-2 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/60" />

                {/* Content */}
                {isHtml
                  ? <RichTextContent html={article.content} className="text-base leading-relaxed" />
                  : <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{article.content}</p>
                }

                <div className="border-t border-border/60" />

                {/* Actions */}
                <div className="flex items-center gap-5">
                  <button onClick={() => void toggleLike()}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}>
                    <Heart className={`w-4 h-4 ${liked ? "fill-red-500" : ""}`} strokeWidth={1.8} />
                    Curtir{likeCount > 0 ? ` ${likeCount}` : ""}
                  </button>
                  <button onClick={() => setCommentsOpen((v) => !v)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${commentsOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
                    Comentar{commentCount > 0 ? ` (${commentCount})` : ""}
                  </button>
                  <button onClick={handleShare}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-4 h-4" strokeWidth={1.8} /> Compartilhar
                  </button>
                </div>

                {/* Comments */}
                <CommentSection postId={article.id} open={commentsOpen}
                  onCommentAdded={() => setCommentCount((c) => c + 1)} />
              </div>
            </div>
          </motion.article>

          {/* Right sidebar */}
          <div className="hidden lg:flex flex-col gap-5 w-[260px] shrink-0">
            <WhoIsOnlineCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
