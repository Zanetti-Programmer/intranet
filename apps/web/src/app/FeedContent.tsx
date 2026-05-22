"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { AnnouncementsWidget } from "@/components/feed/AnnouncementsWidget";
import { GroupDiscussionsCard, LatestNewsCard, TeamMembersCard } from "@/components/feed/GroupDiscussionsCard";
import { SpacesWidget } from "@/components/feed/SpacesWidget";
import { HeroPostCard, FromTheBlogCard } from "@/components/feed/FromTheBlogCard";
import { WhoIsOnlineCard } from "@/components/widgets/WhoIsOnlineCard";
import { TopEventsCard } from "@/components/widgets/TopEventsCard";
import { MiniCalendarWidget } from "@/components/widgets/MiniCalendarWidget";
import { ProgressBarsCard } from "@/components/widgets/ProgressBarsCard";
import { usePosts } from "@/lib/hooks/usePosts";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { Loader2 } from "lucide-react";
import type { Post } from "@/types";
import getPocketBase from "@/lib/pocketbase";

function FeedInner() {
  const searchParams = useSearchParams();
  const spaceFilter = searchParams?.get("space") ?? null;

  const { spaces } = useSpaces();
  const { posts, loading, createPost, deletePost } = usePosts(spaceFilter);
  const { announcements } = useAnnouncements();

  // Posts with images for "From The Blog"
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("posts").getList(1, 4, { sort: "-created", expand: "author" })
      .then((r) => {
        const withImages = (r.items as unknown as Post[]).filter(
          p => p.attachments && p.attachments.length > 0
        );
        setBlogPosts(withImages.slice(0, 3));
      }).catch(() => {});
  }, []);

  const heroPosts = posts.filter(p => p.attachments && p.attachments.length > 0).slice(0, 1);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-5 py-5">
        <div className="flex gap-5 items-start">

          {/* ── COLUNA ESQUERDA ────────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-5 w-[270px] xl:w-[290px] shrink-0">
            <GroupDiscussionsCard />
            <LatestNewsCard announcements={announcements} />
            <TeamMembersCard />
            <TopEventsCard />
          </div>

          {/* ── COLUNA CENTRAL ────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Post Composer */}
            <PostComposer
              spaces={spaces}
              defaultSpaceId={spaceFilter ?? undefined}
              onSubmit={createPost}
            />

            {/* Activity Feed */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-2">
                <p className="text-4xl">✨</p>
                <p className="text-sm font-semibold">Nenhuma publicação ainda</p>
                <p className="text-xs text-muted-foreground">Seja o primeiro a postar!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    space={spaces.find((s) => s.id === post.space)}
                    onDelete={deletePost}
                  />
                ))}
              </div>
            )}

            {/* Hero post (featured article) */}
            {heroPosts.length > 0 && (
              <HeroPostCard post={heroPosts[0]} />
            )}

            {/* From The Blog */}
            {blogPosts.length > 0 && (
              <FromTheBlogCard posts={blogPosts} />
            )}

            {/* LOAD MORE */}
            {posts.length > 0 && (
              <button className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
                LOAD MORE
              </button>
            )}
          </div>

          {/* ── COLUNA DIREITA ────────────────────────────── */}
          <div className="hidden xl:flex flex-col gap-5 w-[270px] shrink-0">
            {/* Newsletter / Avisos */}
            <AnnouncementsWidget announcements={announcements} />

            {/* Groups com tabs */}
            <SpacesWidget />

            {/* Who's Online */}
            <WhoIsOnlineCard />

            {/* Mini Calendar */}
            <MiniCalendarWidget />

            {/* Progress Bar */}
            <ProgressBarsCard />
          </div>

        </div>
      </div>
    </div>
  );
}

export function FeedContent() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    }>
      <FeedInner />
    </Suspense>
  );
}
