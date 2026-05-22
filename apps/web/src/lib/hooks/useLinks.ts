"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { UsefulLink } from "@/types";

export function useLinks() {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("useful_links").getFullList({ sort: "category,order,title" });
      setLinks(items as unknown as UsefulLink[]);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("useful_links").subscribe("*", () => fetchAll()).catch(() => {});
    return () => { pb.collection("useful_links").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

  const createLink = useCallback(async (data: {
    title: string; url: string; description: string; category: string; icon: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("useful_links").create({ ...data, author: pb.authStore.record!.id });
  }, []);

  const deleteLink = useCallback(async (id: string) => {
    const pb = getPocketBase();
    await pb.collection("useful_links").delete(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { links, loading, createLink, deleteLink };
}
