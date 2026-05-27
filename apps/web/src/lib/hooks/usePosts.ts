"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Post, PostComment, PostReaction } from "@/types";

const PAGE_SIZE = 20;

export function usePosts(spaceFilter?: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  const load = useCallback(async (page: number) => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    setLoading(true);
    const filter = spaceFilter ? `space = "${spaceFilter}"` : "";
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * attempt));
        const result = await pb.collection("posts").getList(page, PAGE_SIZE, {
          sort: "-created",
          expand: "author",
          filter,
        });
        if (page === 1) {
          setPosts(result.items as unknown as Post[]);
        } else {
          setPosts((prev) => [...prev, ...result.items as unknown as Post[]]);
        }
        setHasMore(result.totalPages > page);
        pageRef.current = page;
        setLoading(false);
        return;
      } catch (e) {
        lastErr = e;
        const status = (e as { status?: number }).status;
        if (status !== 503 && status !== 429) break;
      }
    }
    if (page === 1) setPosts([]);
    setLoading(false);
  }, [spaceFilter]);

  useEffect(() => {
    load(1);
    const pb = getPocketBase();

    // Re-load when auth becomes valid after SSR hydration
    const authUnsub = pb.authStore.onChange(() => {
      if (pb.authStore.isValid) load(1);
    });

    if (!pb.authStore.isValid) return authUnsub;

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
    }).catch((e) => console.error("[realtime] posts:", e));

    return () => {
      authUnsub();
      pb.collection("posts").unsubscribe("*").catch(() => {});
    };
  }, [load]);

  const createPost = useCallback(
    async (content: string, spaceId?: string, files?: File[]) => {
      const pb = getPocketBase();
      const formData = new FormData();
      formData.append("content", content);
      formData.append("author", pb.authStore.record!.id);
      if (spaceId) formData.append("space", spaceId);
      files?.forEach((f) => formData.append("attachments", f));
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * attempt));
          await pb.collection("posts").create(formData);
          return;
        } catch (e) {
          lastErr = e;
          const status = (e as { status?: number }).status;
          if (status !== 503 && status !== 429) break;
        }
      }
      throw lastErr;
    },
    []
  );

  const deletePost = useCallback(async (id: string) => {
    // Optimistically remove from state so UI updates even if realtime is degraded
    setPosts((prev) => prev.filter((p) => p.id !== id));
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * attempt));
        await getPocketBase().collection("posts").delete(id);
        return;
      } catch (e) {
        lastErr = e;
        const status = (e as { status?: number }).status;
        if (status !== 503 && status !== 429) break;
      }
    }
    // On failure, restore the post list
    setPosts((prev) => prev);
    throw lastErr;
  }, []);

  const updatePost = useCallback(async (id: string, content: string) => {
    await getPocketBase().collection("posts").update(id, { content });
  }, []);

  const loadMore = useCallback(() => load(pageRef.current + 1), [load]);

  return { posts, loading, hasMore, loadMore, createPost, deletePost, updatePost, refetch: () => load(1) };
}

// ── Reactions ─────────────────────────────────────────────────────────────────
export function useReactions(postId: string) {
  const [reactions, setReactions] = useState<PostReaction[]>([]);
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;

    pb.collection("post_reactions")
      .getFullList({ filter: `post = "${postId}"` })
      .then((r) => setReactions(r as unknown as PostReaction[]))
      .catch(() => {});

    pb.collection("post_reactions").subscribe("*", (e) => {
      if (e.action === "create" && e.record.post === postId) {
        setReactions((prev) => {
          if (prev.some((r) => r.id === e.record.id)) return prev;
          return [...prev, e.record as unknown as PostReaction];
        });
      } else if (e.action === "delete") {
        setReactions((prev) => prev.filter((r) => r.id !== e.record.id));
      }
    }).catch((e) => console.error("[realtime] post_reactions:", e));

    return () => { pb.collection("post_reactions").unsubscribe("*").catch(() => {}); };
  }, [postId]);

  const toggle = useCallback(
    async (emoji: string) => {
      const key = `${postId}-${emoji}`;
      if (pendingRef.current.has(key)) return; // prevent double-click duplicates
      pendingRef.current.add(key);
      try {
        const pb = getPocketBase();
        const userId = pb.authStore.record!.id;
        const existing = reactions.find((r) => r.post === postId && r.user === userId && r.emoji === emoji);
        if (existing) {
          await pb.collection("post_reactions").delete(existing.id);
          // Optimistic: remove immediately; realtime will also fire but filter is idempotent
          setReactions((prev) => prev.filter((r) => r.id !== existing.id));
        } else {
          const created = await pb.collection("post_reactions").create({ post: postId, user: userId, emoji });
          // Optimistic: add immediately; realtime dedup prevents double-add
          setReactions((prev) => {
            if (prev.some((r) => r.id === created.id)) return prev;
            return [...prev, created as unknown as PostReaction];
          });
        }
      } finally {
        pendingRef.current.delete(key);
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
