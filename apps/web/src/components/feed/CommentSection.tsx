"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "@/lib/hooks/usePosts";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function CommentSection({ postId, open, onCommentAdded }: { postId: string; open: boolean; onCommentAdded?: () => void }) {
  const { comments, loading, addComment } = useComments(postId, open);
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment(text.trim());
      setText("");
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
              <p className="text-xs text-muted-foreground text-center py-2">Carregando...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum comentário ainda</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  {c.expand?.author && (
                    <UserAvatar user={c.expand.author} size="sm" className="shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">{c.expand?.author?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(c.created)}</span>
                    </div>
                    <p className="text-sm mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))
            )}

            {/* Input */}
            {user && (
              <div className="flex gap-2.5 items-end">
                <UserAvatar user={user} size="sm" className="shrink-0 mb-0.5" />
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Escreva um comentário..."
                    className="min-h-0 h-9 resize-none text-sm py-2 bg-muted border-0 focus-visible:ring-1"
                    rows={1}
                  />
                  <Button size="sm" onClick={handleSend} disabled={!text.trim() || sending} className="h-9 px-3">
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
