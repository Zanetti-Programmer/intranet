"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Post, Space } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ReactionBar } from "./ReactionBar";
import { CommentSection } from "./CommentSection";
import { SpaceBadge } from "./SpaceBadge";
import { formatDistanceToNow, pbFileUrl } from "@/lib/utils";
import { MessageCircle, Trash2, Pin, Star } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  post: Post;
  space?: Space;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, space, onDelete }: Props) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [starred, setStarred] = useState(false);
  const author = post.expand?.author;

  const images = (post.attachments ?? []).filter((f) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  const canDelete = user?.id === post.author || user?.role === "admin";

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-border/80 transition-colors"
    >
      {/* Header — "X posted an update" style */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {author && <UserAvatar user={author} size="md" />}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold">{author?.name ?? "Usuário"}</span>
              <span className="text-xs text-muted-foreground">publicou uma atualização</span>
              {space && <SpaceBadge space={space} />}
              {post.pinned && <Pin className="w-3 h-3 text-primary" />}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(post.created)}
              {author?.department && <> · {author.department}</>}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Deletar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className={cn("px-4 pb-3 grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((img) => (
            <div key={img} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <Image
                src={pbFileUrl("posts", post.id, img, "800x450")}
                alt="" fill className="object-cover" unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions bar — Comment / Favorite / Delete */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-border/60">
        <ReactionBar postId={post.id} />
        <div className="flex-1" />
        <button
          onClick={() => setCommentsOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors",
            commentsOpen
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Comentar</span>
        </button>
        <button
          onClick={() => setStarred((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors",
            starred
              ? "text-amber-400 bg-amber-400/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", starred && "fill-amber-400")} />
          <span>Favoritar</span>
        </button>
      </div>

      {/* Comments */}
      <div className="px-4 pb-3">
        <CommentSection postId={post.id} open={commentsOpen} />
      </div>
    </motion.article>
  );
}
