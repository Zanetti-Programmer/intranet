"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Post, Space } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CommentSection } from "./CommentSection";
import { SpaceBadge } from "./SpaceBadge";
import { formatDistanceToNow, pbFileUrl } from "@/lib/utils";
import { Heart, MessageCircle, Star, Trash2, Share2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import { cn } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";

interface Props {
  post: Post;
  space?: Space;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, space, onDelete }: Props) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liked, setLiked]   = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [starred, setStarred] = useState(false);
  const author = post.expand?.author;
  const canDelete = user?.id === post.author || user?.role === "admin";

  const images = (post.attachments ?? []).filter((f) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  function handleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => liked ? c - 1 : c + 1);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          {author && <UserAvatar user={author} size="md" className="shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">
              <span className="font-semibold">{author?.name ?? "Usuário"}</span>
              {space ? (
                <> publicou uma atualização no grupo <SpaceBadge space={space} /></>
              ) : (
                <span className="text-muted-foreground font-normal"> publicou uma atualização</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatDistanceToNow(post.created)}</p>
          </div>
        </div>
      </div>

      {/* Liked indicator (like in Alliance — heart + count above separator) */}
      {liked && likeCount > 0 && (
        <div className="px-5 pb-2 flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span className="text-xs text-muted-foreground">{likeCount}</span>
        </div>
      )}

      {/* Separator */}
      <div className="mx-5 border-t border-border/60" />

      {/* Content */}
      {post.content && (
        <div className="px-5 py-4">
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

      {/* Action bar — exact Alliance: Like | Comment 0 | Favorite | Delete | Share */}
      <div className="mx-5 border-t border-border/60" />
      <div className="flex items-center gap-4 px-5 py-3">
        <button onClick={handleLike}
          className={cn("flex items-center gap-1.5 text-xs transition-colors",
            liked ? "text-red-500" : "text-muted-foreground hover:text-foreground")}>
          <Heart className={cn("w-3.5 h-3.5", liked && "fill-red-500")} />
          <span>Like{likeCount > 0 && ` ${likeCount}`}</span>
        </button>

        <button onClick={() => setCommentsOpen((v) => !v)}
          className={cn("flex items-center gap-1.5 text-xs transition-colors",
            commentsOpen ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Comment 0</span>
        </button>

        <button onClick={() => setStarred((v) => !v)}
          className={cn("flex items-center gap-1.5 text-xs transition-colors",
            starred ? "text-amber-400" : "text-muted-foreground hover:text-foreground")}>
          <Star className={cn("w-3.5 h-3.5", starred && "fill-amber-400 text-amber-400")} />
          <span>Favorite</span>
        </button>

        {canDelete && onDelete && (
          <button onClick={() => onDelete(post.id)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}

        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
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
