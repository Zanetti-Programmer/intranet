"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Article } from "@/types";

export function useArticles(type: "news" | "blog") {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string | undefined>(
    () => (getPocketBase().authStore.record as { role?: string })?.role
  );

  const canSeeDrafts = myRole === "admin" || myRole === "rh" || myRole === "ti";

  // Keep role in sync when auth changes (fixes hydration race condition)
  useEffect(() => {
    const pb = getPocketBase();
    const unsub = pb.authStore.onChange(() => {
      setMyRole((pb.authStore.record as { role?: string })?.role);
    }, true);
    return unsub;
  }, []);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    // Read role fresh at fetch time, not from stale closure
    const role = (pb.authStore.record as { role?: string })?.role;
    const canSee = role === "admin" || role === "rh" || role === "ti";
    try {
      const filter = canSee
        ? `type = "${type}"`
        : `type = "${type}" && status = "published"`;
      const items = await pb.collection("articles").getFullList({
        sort: "-created", expand: "author", filter,
      });
      setArticles(items as unknown as Article[]);
    } catch (e) { console.error("[useArticles] fetchAll:", e); }
    finally { setLoading(false); }
  }, [type]);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("articles").subscribe("*", (e) => {
      // Only refetch when the changed record belongs to this type
      if (e.action === "delete" || e.record.type === type) fetchAll();
    }).catch((e) => console.error("[realtime]", e));
    return () => { pb.collection("articles").unsubscribe("*").catch(() => {}); };
  }, [fetchAll, type]);

  const createArticle = useCallback(async (data: {
    title: string; content: string; tags: string;
    status: string; coverFile?: File;
  }) => {
    const pb = getPocketBase();
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("content", data.content);
    fd.append("tags", data.tags);
    fd.append("type", type);
    fd.append("status", data.status);
    fd.append("author", pb.authStore.record!.id);
    if (data.coverFile) fd.append("cover", data.coverFile);
    await pb.collection("articles").create(fd);
  }, [type]);

  const deleteArticle = useCallback(async (id: string) => {
    await getPocketBase().collection("articles").delete(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const publishArticle = useCallback(async (id: string) => {
    await getPocketBase().collection("articles").update(id, { status: "published" });
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, status: "published" as const } : a));
  }, []);

  const updateArticle = useCallback(async (id: string, data: {
    title: string; content: string; tags: string; status: "published" | "draft";
  }) => {
    await getPocketBase().collection("articles").update(id, data);
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, ...data } : a));
  }, []);

  return { articles, loading, createArticle, deleteArticle, publishArticle, updateArticle, canSeeDrafts };
}
