"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "@/lib/hooks/usePosts";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/utils";
import { Loader2, Heart, Reply, Trash2 } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import type { PostComment } from "@/types";

// ── Comment reactions (heart only, stored in comment_reactions) ───────────────
function useCommentLikes(commentId: string) {
  const [likes, setLikes] = useState<string[]>([]); // user IDs who liked
  const pendingRef = useRef(false);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("comment_reactions")
      .getFullList({ filter: `comment = "${commentId}" && emoji = "❤️"` })
      .then((r) => setLikes(r.map((rec) => rec.user as string)))
      .catch(() => {});
  }, [commentId]);

  const toggle = useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const pb = getPocketBase();
      const myId = pb.authStore.record!.id;
      const existing = await pb.collection("comment_reactions")
        .getFirstListItem(`comment = "${commentId}" && user = "${myId}" && emoji = "❤️"`)
        .catch(() => null);
      if (existing) {
        await pb.collection("comment_reactions").delete(existing.id);
        setLikes((p) => p.filter((id) => id !== myId));
      } else {
        await pb.collection("comment_reactions").create({ comment: commentId, user: myId, emoji: "❤️" });
        setLikes((p) => [...p, myId]);
      }
    } finally {
      pendingRef.current = false;
    }
  }, [commentId]);

  return { likes, toggle };
}

// ── Single comment row ────────────────────────────────────────────────────────
function CommentRow({ comment, myId, canDeleteAny, onReply, onDelete }: {
  comment: PostComment;
  myId: string;
  canDeleteAny?: boolean;
  onReply: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const { likes, toggle } = useCommentLikes(comment.id);
  const liked = likes.includes(myId);
  const author = comment.expand?.author;

  return (
    <div className="flex gap-2.5 group">
      {author && <UserAvatar user={author} size="sm" className="shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-xl px-3 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium">{author?.name}</span>
            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(comment.created)}</span>
          </div>
          <p className="text-sm mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <button onClick={() => void toggle()}
            className={cn("flex items-center gap-1 text-[11px] transition-colors",
              liked ? "text-red-500" : "text-muted-foreground hover:text-red-400")}>
            <Heart style={{ width: 11, height: 11 }} className={cn(liked && "fill-red-500")} />
            {likes.length > 0 && <span>{likes.length}</span>}
          </button>
          <button onClick={() => onReply(author?.name ?? "Usuário")}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
            <Reply style={{ width: 11, height: 11 }} /> Responder
          </button>
          {(comment.author === myId || canDeleteAny) && (
            <button onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 style={{ width: 11, height: 11 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ postId, open, canDeleteAny, onCommentAdded }: { postId: string; open: boolean; canDeleteAny?: boolean; onCommentAdded?: () => void }) {
  const { comments, loading, addComment } = useComments(postId, open);
  const { user } = useAuth();
  const myId = getPocketBase().authStore.record?.id ?? "";
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleReply(name: string) {
    setReplyTo(name);
    const prefix = `@${name} `;
    setText(prefix);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  async function handleDelete(id: string) {
    try { await getPocketBase().collection("post_comments").delete(id); }
    catch { /* ignore */ }
  }

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment(text.trim());
      setText("");
      setReplyTo(null);
      onCommentAdded?.();
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-3 border-t border-border space-y-3">
            {loading ? (
              <div className="flex justify-center py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /></div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum comentário ainda</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <CommentRow key={c.id} comment={c} myId={myId} canDeleteAny={canDeleteAny}
                    onReply={handleReply} onDelete={handleDelete} />
                ))}
              </div>
            )}

            {/* Reply indicator */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                  <Reply style={{ width: 11, height: 11 }} />
                  Respondendo a <span className="font-medium text-foreground">@{replyTo}</span>
                  <button onClick={() => { setReplyTo(null); setText(""); }} className="ml-auto hover:text-foreground">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            {user && (
              <div className="flex gap-2.5 items-end">
                <UserAvatar user={user} size="sm" className="shrink-0 mb-0.5" />
                <div className="flex-1 flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                    placeholder={replyTo ? `Responder @${replyTo}...` : "Escreva um comentário..."}
                    className="min-h-0 h-9 resize-none text-sm py-2 bg-muted border-0 focus-visible:ring-1"
                    rows={1}
                  />
                  <Button size="sm" onClick={() => void handleSend()} disabled={!text.trim() || sending} className="h-9 px-3">
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
