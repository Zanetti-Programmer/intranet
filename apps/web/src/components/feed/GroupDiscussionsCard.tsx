"use client";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Post } from "@/types";
import getPocketBase from "@/lib/pocketbase";
import { Loader2 } from "lucide-react";

export function GroupDiscussionsCard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("posts").getList(1, 6, { sort: "-created", expand: "author" })
      .then((r) => setPosts(r.items as unknown as Post[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Discussões em Grupos</h3>
      </div>
      <div className="border-t border-border/60" />

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8 px-4">
          Nenhuma discussão ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {posts.map((post) => {
            const author = post.expand?.author;
            const title = post.content.length > 60
              ? post.content.slice(0, 60) + "…"
              : post.content;
            return (
              <div key={post.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
                {author && (
                  <UserAvatar user={author} size="lg" className="w-12 h-12 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug line-clamp-2">{title}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mt-1">
                    por {author?.name ?? "Usuário"}
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

// Latest News — announcements list
import type { Announcement } from "@/types";

export function LatestNewsCard({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Últimas Notícias</h3>
      </div>
      <div className="border-t border-border/60" />
      <div className="divide-y divide-border/50">
        {announcements.slice(0, 4).map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
            {a.expand?.author && (
              <UserAvatar user={a.expand.author} size="sm" className="shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold line-clamp-1">{a.title}</p>
              {a.expand?.author && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {a.expand.author.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
