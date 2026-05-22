"use client";
import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { User } from "@/types";
import { Loader2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (id: string) => void;
  typingUsers: User[];
}

function groupMessages(msgs: Message[]) {
  return msgs.map((msg, i) => {
    const prev = msgs[i - 1];
    const sameAuthor = prev?.author === msg.author;
    const recentMs = prev
      ? new Date(msg.created).getTime() - new Date(prev.created).getTime()
      : Infinity;
    return { ...msg, showHeader: !sameAuthor || recentMs > 5 * 60 * 1000 };
  });
}

export function MessageList({ messages, loading, hasMore, onLoadMore, onDelete, typingUsers }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll only when new messages arrive at the bottom
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      const container = containerRef.current;
      if (!container) return;
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      if (atBottom || prevLengthRef.current === 0) {
        bottomRef.current?.scrollIntoView({ behavior: messages.length === 1 ? "auto" : "smooth" });
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const grouped = groupMessages(messages);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-2">
      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button variant="ghost" size="sm" onClick={onLoadMore} className="text-xs gap-1.5">
            <ChevronUp className="w-3.5 h-3.5" /> Carregar anteriores
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <span className="text-3xl">💬</span>
          <p className="text-sm font-medium">Seja o primeiro a escrever!</p>
          <p className="text-xs text-muted-foreground">O canal está esperando por você</p>
        </div>
      ) : (
        grouped.map((msg) => (
          <MessageBubble key={msg.id} message={msg} showHeader={msg.showHeader} onDelete={onDelete} />
        ))
      )}

      <TypingIndicator users={typingUsers} />
      <div ref={bottomRef} />
    </div>
  );
}
