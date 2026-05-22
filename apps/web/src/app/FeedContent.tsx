"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { AnnouncementBanner } from "@/components/feed/AnnouncementBanner";
import { AnnouncementsWidget } from "@/components/feed/AnnouncementsWidget";
import { GroupDiscussionsCard, LatestNewsCard } from "@/components/feed/GroupDiscussionsCard";
import { SpacesWidget } from "@/components/feed/SpacesWidget";
import { usePosts } from "@/lib/hooks/usePosts";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

function FeedInner() {
  const searchParams = useSearchParams();
  const spaceFilter = searchParams?.get("space") ?? null;

  const { spaces } = useSpaces();
  const { posts, loading, createPost, deletePost } = usePosts(spaceFilter);
  const { announcements } = useAnnouncements();

  const currentSpace = spaces.find((s) => s.id === spaceFilter);

  return (
    /* Wrapper com padding e scroll para o conteúdo inteiro */
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1280px] mx-auto px-5 py-5">
        <div className="flex gap-5 items-start">

          {/* ── Coluna esquerda (Group Discussions + Latest News) ── */}
          <div className="hidden lg:flex flex-col gap-4 w-[260px] xl:w-[280px] shrink-0 sticky top-0">
            <GroupDiscussionsCard />
            <LatestNewsCard announcements={announcements} />
          </div>

          {/* ── Coluna central (Feed) ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Cabeçalho do espaço ativo */}
            {currentSpace && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${currentSpace.color}20` }}>
                  {currentSpace.icon}
                </div>
                <div>
                  <h2 className="font-bold text-sm">{currentSpace.name}</h2>
                  <p className="text-xs text-muted-foreground">{currentSpace.description}</p>
                </div>
              </motion.div>
            )}

            {/* Avisos urgentes inline */}
            {announcements.some(a => a.priority === "urgent") && (
              <AnnouncementBanner announcements={announcements.filter(a => a.priority === "urgent")} />
            )}

            {/* Composer */}
            <PostComposer spaces={spaces} defaultSpaceId={spaceFilter ?? undefined} onSubmit={createPost} />

            {/* Posts */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 space-y-3">
                <p className="text-4xl">✨</p>
                <p className="text-sm font-semibold">Nenhuma publicação ainda</p>
                <p className="text-xs text-muted-foreground">Seja o primeiro a postar!</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post}
                    space={spaces.find((s) => s.id === post.space)}
                    onDelete={deletePost} />
                ))}
              </div>
            )}
          </div>

          {/* ── Coluna direita (Newsletter + Groups) ── */}
          <div className="hidden xl:flex flex-col gap-4 w-[260px] shrink-0 sticky top-0">
            <AnnouncementsWidget announcements={announcements} />
            <SpacesWidget />
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
