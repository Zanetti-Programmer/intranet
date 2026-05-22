"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Post, Space } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ReactionBar } from "./ReactionBar";
import { CommentSection } from "./CommentSection";
import { SpaceBadge } from "./SpaceBadge";
import { formatDistanceToNow, pbFileUrl } from "@/lib/utils";
import { MessageCircle, Trash2, Pin } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";

interface Props {
  post: Post;
  space?: Space;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, space, onDelete }: Props) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const author = post.expand?.author;

  const images = (post.attachments ?? []).filter((f) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  const canDelete = user?.id === post.author || user?.role === "admin";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-border/80 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {author && <UserAvatar user={author} size="md" />}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{author?.name ?? "Usuário"}</span>
              {post.pinned && <Pin className="w-3 h-3 text-primary" />}
              {space && <SpaceBadge space={space} />}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {author?.department && <>{author.department} · </>}
              {formatDistanceToNow(post.created)}
            </span>
          </div>
        </div>

        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Images */}
      {images.length > 0 && (
        <div className={`grid gap-1.5 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {images.map((img) => (
            <div key={img} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <Image
                src={pbFileUrl("posts", post.id, img, "800x450")}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <ReactionBar postId={post.id} />
        <button
          onClick={() => setCommentsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Comentar</span>
        </button>
      </div>

      <CommentSection postId={post.id} open={commentsOpen} />
    </motion.article>
  );
}
