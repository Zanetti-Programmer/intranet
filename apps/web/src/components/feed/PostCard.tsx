"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Post, Space } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ReactionBar } from "./ReactionBar";
import { CommentSection } from "./CommentSection";
import { SpaceBadge } from "./SpaceBadge";
import { formatDistanceToNow, pbFileUrl } from "@/lib/utils";
import { MessageCircle, Trash2, Star } from "lucide-react";
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
  const [commentCount, setCommentCount] = useState(0);
  const [starred, setStarred] = useState(false);
  const author = post.expand?.author;
  const canDelete = user?.id === post.author || user?.role === "admin";

  const images = (post.attachments ?? []).filter((f) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        {author && <UserAvatar user={author} size="md" className="shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm font-semibold">{author?.name ?? "Usuário"}</span>
            <span className="text-xs text-muted-foreground">publicou uma atualização</span>
            {space && (
              <span className="text-xs text-muted-foreground">
                no grupo <SpaceBadge space={space} />
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatDistanceToNow(post.created)}
          </p>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className={cn("px-5 pb-4 grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((img) => (
            <div key={img} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <Image src={pbFileUrl("posts", post.id, img, "800x450")}
                alt="" fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* Actions bar — exact Alliance style */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-border/60 text-xs text-muted-foreground">
        <button
          onClick={() => setCommentsOpen((v) => !v)}
          className={cn("flex items-center gap-1.5 hover:text-foreground transition-colors",
            commentsOpen && "text-primary")}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Comentar {commentCount > 0 && commentCount}</span>
        </button>

        <button
          onClick={() => setStarred((v) => !v)}
          className={cn("flex items-center gap-1.5 hover:text-foreground transition-colors",
            starred && "text-amber-400")}
        >
          <Star className={cn("w-3.5 h-3.5", starred && "fill-amber-400 text-amber-400")} />
          <span>Favoritar</span>
        </button>

        <ReactionBar postId={post.id} />

        {canDelete && onDelete && (
          <button onClick={() => onDelete(post.id)}
            className="flex items-center gap-1.5 hover:text-destructive transition-colors ml-auto">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Deletar</span>
          </button>
        )}
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="px-5 pb-4 border-t border-border/40">
          <CommentSection postId={post.id} open={commentsOpen} />
        </div>
      )}
    </motion.article>
  );
}
