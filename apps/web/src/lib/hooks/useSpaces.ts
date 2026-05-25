"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Space } from "@/types";

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    pb.collection("spaces")
      .getFullList({ sort: "name" })
      .then((items) => setSpaces(items as unknown as Space[]))
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("spaces").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
    return () => { pb.collection("spaces").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

  const createSpace = useCallback(async (data: {
    name: string; description: string; color: string; icon: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("spaces").create({ ...data, created_by: pb.authStore.record!.id });
  }, []);

  const deleteSpace = useCallback(async (id: string) => {
    await getPocketBase().collection("spaces").delete(id);
    setSpaces((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { spaces, loading, createSpace, deleteSpace };
}
