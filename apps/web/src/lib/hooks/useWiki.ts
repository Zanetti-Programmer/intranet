"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { WikiArticle } from "@/types";

export function useWiki() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("wiki_articles").getFullList({
        sort: "category,title", expand: "author",
      });
      setArticles(items as unknown as WikiArticle[]);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("wiki_articles").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
    return () => { pb.collection("wiki_articles").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

  const createArticle = useCallback(async (data: {
    title: string; content: string; category: string; tags: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("wiki_articles").create({ ...data, author: pb.authStore.record!.id });
  }, []);

  const updateArticle = useCallback(async (id: string, data: {
    title: string; content: string; category: string; tags: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("wiki_articles").update(id, data);
    fetchAll();
  }, [fetchAll]);

  const deleteArticle = useCallback(async (id: string) => {
    const pb = getPocketBase();
    await pb.collection("wiki_articles").delete(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { articles, loading, createArticle, updateArticle, deleteArticle };
}
