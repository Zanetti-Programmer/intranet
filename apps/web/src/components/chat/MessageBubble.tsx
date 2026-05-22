"use client";
import { motion } from "framer-motion";
import type { Message } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDistanceToNow, pbFileUrl } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

interface Props {
  message: Message;
  showHeader: boolean;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, showHeader, onDelete }: Props) {
  const author = message.expand?.author;
  const myId = getPocketBase().authStore.record?.id;
  const isOwn = message.author === myId;

  const images = (message.attachments ?? []).filter((f) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );
  const files = (message.attachments ?? []).filter((f) =>
    !/\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group flex gap-3 px-4 hover:bg-muted/30 transition-colors rounded-lg py-0.5",
        showHeader ? "mt-3 pt-1" : "mt-0")}
    >
      {/* Avatar column - fixed width */}
      <div className="w-9 shrink-0 mt-0.5">
        {showHeader && author && <UserAvatar user={author} size="md" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold">{author?.name ?? "Usuário"}</span>
            {author?.department && (
              <span className="text-[10px] text-muted-foreground">{author.department}</span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(message.created)}
            </span>
          </div>
        )}

        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className={`mt-1.5 grid gap-1 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"} max-w-sm`}>
            {images.map((img) => (
              <div key={img} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={pbFileUrl("messages", message.id, img, "600x340")}
                  alt="" fill className="object-cover" unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* Files */}
        {files.map((f) => (
          <a key={f}
            href={pbFileUrl("messages", message.id, f)}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded-lg"
          >
            📎 {f.split("/").pop()}
          </a>
        ))}
      </div>

      {/* Delete action */}
      {isOwn && onDelete && (
        <button
          onClick={() => onDelete(message.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 shrink-0 mt-0.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
