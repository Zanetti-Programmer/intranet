"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Post, PostComment, PostReaction } from "@/types";

export function usePosts(spaceFilter?: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const filter = spaceFilter ? `space = "${spaceFilter}"` : "";
      const result = await pb.collection("posts").getList(1, 50, {
        sort: "-created",
        expand: "author",
        filter,
      });
      setPosts(result.items as unknown as Post[]);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [spaceFilter]);

  useEffect(() => {
    fetchPosts();
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;

    pb.collection("posts").subscribe("*", async (e) => {
      if (e.action === "create") {
        try {
          const full = await pb.collection("posts").getOne(e.record.id, { expand: "author" });
          setPosts((prev) => [full as unknown as Post, ...prev]);
        } catch {}
      } else if (e.action === "delete") {
        setPosts((prev) => prev.filter((p) => p.id !== e.record.id));
      } else if (e.action === "update") {
        setPosts((prev) =>
          prev.map((p) => (p.id === e.record.id ? { ...p, ...e.record } as Post : p))
        );
      }
    }).catch(() => {});

    return () => { pb.collection("posts").unsubscribe("*").catch(() => {}); };
  }, [fetchPosts]);

  const createPost = useCallback(
    async (content: string, spaceId?: string, files?: File[]) => {
      const pb = getPocketBase();
      const formData = new FormData();
      formData.append("content", content);
      formData.append("author", pb.authStore.record!.id);
      if (spaceId) formData.append("space", spaceId);
      files?.forEach((f) => formData.append("attachments", f));
      await pb.collection("posts").create(formData);
    },
    []
  );

  const deletePost = useCallback(async (id: string) => {
    await getPocketBase().collection("posts").delete(id);
  }, []);

  return { posts, loading, createPost, deletePost, refetch: fetchPosts };
}

// ── Reactions ─────────────────────────────────────────────────────────────────
export function useReactions(postId: string) {
  const [reactions, setReactions] = useState<PostReaction[]>([]);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;

    pb.collection("post_reactions")
      .getFullList({ filter: `post = "${postId}"` })
      .then((r) => setReactions(r as unknown as PostReaction[]))
      .catch(() => {});

    pb.collection("post_reactions").subscribe("*", (e) => {
      if (e.action === "create" && e.record.post === postId) {
        setReactions((prev) => [...prev, e.record as unknown as PostReaction]);
      } else if (e.action === "delete") {
        setReactions((prev) => prev.filter((r) => r.id !== e.record.id));
      }
    }).catch(() => {});

    return () => { pb.collection("post_reactions").unsubscribe("*").catch(() => {}); };
  }, [postId]);

  const toggle = useCallback(
    async (emoji: string) => {
      const pb = getPocketBase();
      const userId = pb.authStore.record!.id;
      const existing = reactions.find((r) => r.post === postId && r.user === userId && r.emoji === emoji);
      if (existing) {
        await pb.collection("post_reactions").delete(existing.id);
      } else {
        await pb.collection("post_reactions").create({ post: postId, user: userId, emoji });
      }
    },
    [postId, reactions]
  );

  return { reactions, toggle };
}

// ── Comments ──────────────────────────────────────────────────────────────────
export function useComments(postId: string, enabled: boolean) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;

    setLoading(true);
    pb.collection("post_comments")
      .getFullList({ filter: `post = "${postId}"`, sort: "created", expand: "author" })
      .then((r) => setComments(r as unknown as PostComment[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, enabled]);

  const addComment = useCallback(
    async (content: string) => {
      const pb = getPocketBase();
      const record = await pb.collection("post_comments").create(
        { post: postId, author: pb.authStore.record!.id, content },
        { expand: "author" }
      );
      setComments((prev) => [...prev, record as unknown as PostComment]);
    },
    [postId]
  );

  return { comments, loading, addComment };
}
