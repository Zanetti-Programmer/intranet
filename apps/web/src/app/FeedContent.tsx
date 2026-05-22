"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { AnnouncementBanner } from "@/components/feed/AnnouncementBanner";
import { AnnouncementsWidget } from "@/components/feed/AnnouncementsWidget";
import { GroupDiscussionsCard } from "@/components/feed/GroupDiscussionsCard";
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
    <div className="flex gap-5 h-full min-h-0 p-5">

      {/* ── Coluna esquerda: Discussões ───────────────────── */}
      <div className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 shrink-0 overflow-y-auto">
        <GroupDiscussionsCard />
      </div>

      {/* ── Coluna central: Feed ──────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto space-y-4 pb-6">

        {/* Cabeçalho do espaço ativo */}
        {currentSpace && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${currentSpace.color}20` }}>
              {currentSpace.icon}
            </div>
            <div>
              <h2 className="font-semibold text-sm">{currentSpace.name}</h2>
              <p className="text-xs text-muted-foreground">{currentSpace.description}</p>
            </div>
          </motion.div>
        )}

        {/* Avisos pinned */}
        {announcements.length > 0 && (
          <AnnouncementBanner announcements={announcements} />
        )}

        {/* Composer */}
        <PostComposer
          spaces={spaces}
          defaultSpaceId={spaceFilter ?? undefined}
          onSubmit={createPost}
        />

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 space-y-2">
            <p className="text-4xl">✨</p>
            <p className="text-sm font-medium">Nenhuma publicação ainda</p>
            <p className="text-xs text-muted-foreground">Seja o primeiro a postar!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
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
      </div>

      {/* ── Coluna direita: Widgets ───────────────────────── */}
      <div className="hidden xl:flex flex-col gap-4 w-60 shrink-0 overflow-y-auto pb-6">
        {announcements.length > 0 && (
          <AnnouncementsWidget announcements={announcements} />
        )}
        <Suspense>
          <SpacesWidget />
        </Suspense>
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
