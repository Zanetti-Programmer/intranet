"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Post, Space } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CommentSection } from "./CommentSection";
import { SpaceBadge } from "./SpaceBadge";
import { formatDistanceToNow, pbFileUrl } from "@/lib/utils";
import { Heart, MessageCircle, Star, Trash2, Share2, MoreHorizontal, Pencil, X, Check } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useReactions, useStars } from "@/lib/hooks/usePosts";
import getPocketBase from "@/lib/pocketbase";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  post: Post;
  space?: Space;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, content: string) => Promise<void>;
}

export function PostCard({ post, space, onDelete, onUpdate }: Props) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const { starred, toggle: toggleStar } = useStars(post.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { reactions, toggle } = useReactions(post.id);
  const myId = getPocketBase().authStore.record?.id ?? "";
  const author   = post.expand?.author;
  const isOwn    = user?.id === post.author;
  const canDelete = isOwn || user?.role === "admin";
  const canEdit   = isOwn;

  const liked     = reactions.some((r) => r.user === myId && r.emoji === "❤️");
  const likeCount = reactions.filter((r) => r.emoji === "❤️").length;

  const images = (post.attachments ?? []).filter((f) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("post_comments").getList(1, 1, { filter: `post = "${post.id}"` })
      .then((r) => setCommentCount(r.totalItems))
      .catch(() => {});
  }, [post.id]);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function handleSaveEdit() {
    if (!editContent.trim() || !onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(post.id, editContent.trim());
      setEditing(false);
      toast.success("Publicação atualizada.");
    } catch {
      toast.error("Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copiado!")).catch(() => {});
    setShareOpen(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-start gap-3">
          {author && <UserAvatar user={author} size="md" className="shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] leading-snug">
              <span className="font-semibold">{author?.name ?? "Usuário"}</span>
              {space
                ? <> publicou uma atualização no grupo <SpaceBadge space={space} /></>
                : <span className="text-muted-foreground font-normal"> publicou uma atualização</span>
              }
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(post.created)}
            </p>
          </div>

          {/* Three-dots menu for own posts */}
          {(canEdit || canDelete) && (
            <div ref={menuRef} className="relative shrink-0">
              <button
                aria-label="Abrir menu"
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-9 z-20 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[140px]"
                  >
                    {canEdit && (
                      <button
                        onClick={() => { setEditing(true); setEditContent(post.content); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Editar
                      </button>
                    )}
                    {canDelete && onDelete && (
                      <button
                        onClick={() => { onDelete(post.id); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Like count */}
      {likeCount > 0 && (
        <div className="flex items-center gap-1 px-5 pt-3">
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span className="text-xs text-muted-foreground">{likeCount}</span>
        </div>
      )}

      <div className="mx-5 mt-4 border-t border-border/60" />

      {/* Content / Edit mode */}
      {editing ? (
        <div className="px-5 py-4 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editContent.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          </div>
        </div>
      ) : post.content ? (
        <div className="px-5 py-4">
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      ) : null}

      {/* Images */}
      {images.length > 0 && (
        <div className={cn("px-5 pb-4 grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((img) => (
            <div key={img} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <Image src={pbFileUrl("posts", post.id, img, "800x450")} alt=""
                fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="mx-5 border-t border-border/60" />
      <div className="flex items-center flex-wrap gap-x-5 gap-y-1 px-5 py-3">

        <button onClick={() => void toggle("❤️")}
          className={cn("flex items-center gap-1.5 text-[12px] transition-colors",
            liked ? "text-red-500" : "text-muted-foreground hover:text-foreground")}>
          <Heart className={cn("w-3.5 h-3.5", liked && "fill-red-500")} strokeWidth={1.8} />
          <span>Curtir{likeCount > 0 ? ` ${likeCount}` : ""}</span>
        </button>

        <button onClick={() => setCommentsOpen((v) => !v)}
          className={cn("flex items-center gap-1.5 text-[12px] transition-colors",
            commentsOpen ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
          <span>Comentar{commentCount > 0 ? ` ${commentCount}` : ""}</span>
        </button>

        <button onClick={() => void toggleStar()}
          className={cn("flex items-center gap-1.5 text-[12px] transition-colors",
            starred ? "text-amber-400" : "text-muted-foreground hover:text-foreground")}>
          <Star className={cn("w-3.5 h-3.5", starred && "fill-amber-400 text-amber-400")} strokeWidth={1.8} />
          <span>Favoritar</span>
        </button>

        <button onClick={handleShare}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="w-3.5 h-3.5" strokeWidth={1.8} />
          <span>Compartilhar</span>
        </button>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="px-5 pb-4 border-t border-border/40">
          <CommentSection postId={post.id} open={commentsOpen}
            onCommentAdded={() => setCommentCount((c) => c + 1)} />
        </div>
      )}
    </motion.article>
  );
}
