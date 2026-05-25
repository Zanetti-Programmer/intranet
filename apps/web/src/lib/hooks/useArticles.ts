"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Article } from "@/types";

export function useArticles(type: "news" | "blog") {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canSeeDrafts = myRole === "admin" || myRole === "rh" || myRole === "ti";

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const filter = canSeeDrafts
        ? `type = "${type}"`
        : `type = "${type}" && status = "published"`;
      const items = await pb.collection("articles").getFullList({
        sort: "-created", expand: "author", filter,
      });
      setArticles(items as unknown as Article[]);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  }, [type, canSeeDrafts]);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("articles").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
    return () => { pb.collection("articles").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

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
    fetchAll();
  }, [fetchAll]);

  return { articles, loading, createArticle, deleteArticle, publishArticle, canSeeDrafts };
}
