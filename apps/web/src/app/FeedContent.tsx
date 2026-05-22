"use client";
import { useSearchParams } from "next/navigation";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { AnnouncementBanner } from "@/components/feed/AnnouncementBanner";
import { usePosts } from "@/lib/hooks/usePosts";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function FeedContent() {
  const searchParams = useSearchParams();
  const spaceFilter = searchParams?.get("space") ?? null;

  const { spaces } = useSpaces();
  const { posts, loading, createPost, deletePost } = usePosts(spaceFilter);
  const { announcements } = useAnnouncements();

  const currentSpace = spaces.find((s) => s.id === spaceFilter);

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
      {currentSpace && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 pb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${currentSpace.color}25` }}>
            {currentSpace.icon}
          </div>
          <div>
            <h2 className="font-semibold">{currentSpace.name}</h2>
            <p className="text-xs text-muted-foreground">{currentSpace.description}</p>
          </div>
        </motion.div>
      )}

      <AnnouncementBanner announcements={announcements} />

      <PostComposer spaces={spaces} defaultSpaceId={spaceFilter ?? undefined} onSubmit={createPost} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-12 space-y-2">
          <p className="text-2xl">✨</p>
          <p className="text-sm font-medium">Nenhuma publicação ainda</p>
          <p className="text-xs text-muted-foreground">Seja o primeiro a postar!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post}
              space={spaces.find((s) => s.id === post.space)}
              onDelete={deletePost} />
          ))}
        </div>
      )}
    </div>
  );
}
