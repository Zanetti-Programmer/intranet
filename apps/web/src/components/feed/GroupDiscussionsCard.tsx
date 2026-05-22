"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDistanceToNow } from "@/lib/utils";
import type { Post } from "@/types";
import getPocketBase from "@/lib/pocketbase";
import { Loader2, MessagesSquare } from "lucide-react";

export function GroupDiscussionsCard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("posts").getList(1, 6, { sort: "-created", expand: "author,space" })
      .then((r) => setPosts(r.items as unknown as Post[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessagesSquare className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Discussões em Grupos</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhuma discussão ainda</p>
      ) : (
        <div className="divide-y divide-border">
          {posts.map((post) => {
            const author = post.expand?.author;
            const truncated = post.content.length > 55
              ? post.content.slice(0, 55) + "…"
              : post.content;
            return (
              <div key={post.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                {author && <UserAvatar user={author} size="sm" className="shrink-0 mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {truncated}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                    por {author?.name?.split(" ")[0]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
