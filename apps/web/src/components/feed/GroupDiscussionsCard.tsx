"use client";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDistanceToNow } from "@/lib/utils";
import type { Post } from "@/types";
import type { Announcement } from "@/types";
import getPocketBase from "@/lib/pocketbase";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { pbFileUrl } from "@/lib/utils";

// ── Group Discussions ──────────────────────────────────────────────────────────
export function GroupDiscussionsCard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("posts").getList(1, 5, { sort: "-created", expand: "author" })
      .then((r) => setPosts(r.items as unknown as Post[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Group Discussions</h3>
      </div>
      <div className="border-t border-border/60" />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6 px-4">Seja o primeiro a publicar!</p>
      ) : (
        <div className="divide-y divide-border/50">
          {posts.map((post) => {
            const author = post.expand?.author;
            const title = post.content.length > 52
              ? post.content.slice(0, 52) + "…"
              : post.content;
            return (
              <div key={post.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
                {author && (
                  <UserAvatar user={author} size="lg" className="w-[60px] h-[60px] shrink-0 rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-snug line-clamp-2">{title}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mt-1.5">
                    BY {author?.name?.toUpperCase() ?? "USUÁRIO"}
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

// ── Latest News (announcements) ────────────────────────────────────────────────
export function LatestNewsCard({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Latest News</h3>
      </div>
      <div className="border-t border-border/60" />

      <div className="divide-y divide-border/50">
        {announcements.slice(0, 3).map((a) => (
          <div key={a.id} className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              {a.expand?.author && (
                <UserAvatar user={a.expand.author} size="sm" className="w-9 h-9 shrink-0 rounded-full" />
              )}
              <div>
                <p className="text-[13px] font-semibold leading-none">{a.expand?.author?.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(a.created).toLocaleDateString("pt-BR", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            {/* Thumbnail placeholder */}
            <div className="w-full aspect-[2/1] rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden flex items-center justify-center">
              <p className="text-xs text-muted-foreground/60 text-center px-4 line-clamp-2">{a.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Team Members ───────────────────────────────────────────────────────────────
export function TeamMembersCard() {
  const [users, setUsers] = useState<{ id: string; name: string; avatar?: string; department?: string }[]>([]);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getList(1, 6, { sort: "-created" })
      .then((r) => setUsers(r.items as unknown as typeof users))
      .catch(() => {});
  }, []);

  const tabs = ["NEWEST", "ACTIVE", "POPULAR"];
  const [tab, setTab] = useState("NEWEST");

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h3 className="text-base font-bold">Team Members</h3>
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {users.length}
        </span>
      </div>
      <div className="border-t border-border/60" />

      {/* Tabs */}
      <div className="flex gap-2 px-5 py-3 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              tab === t
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {t}
          </button>
        ))}
      </div>
      <div className="border-t border-border/60" />

      <div className="divide-y divide-border/50">
        {users.slice(0, 4).map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
            <div className="relative">
              <UserAvatar user={{ ...u, name: u.name }} size="md" className="w-11 h-11 shrink-0 rounded-full" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${i === 0 ? "bg-green-500" : "bg-muted-foreground/40"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{u.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5">
                {i === 0 ? "ACTIVE RIGHT NOW" : i < 2 ? "ACTIVE 4 DAYS AGO" : "ACTIVE RECENTLY"}
              </p>
            </div>
            <button className="text-muted-foreground/40 hover:text-muted-foreground text-sm leading-none">···</button>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60">
        <button className="w-full flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          VIEW ALL <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">→</span>
        </button>
      </div>
    </div>
  );
}
