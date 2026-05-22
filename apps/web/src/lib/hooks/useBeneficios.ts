"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Benefit } from "@/types";

export function useBeneficios() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("benefits").getFullList({ sort: "category,title" });
      setBenefits(items as unknown as Benefit[]);
    } catch {
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("benefits").subscribe("*", () => fetchAll()).catch(() => {});
    return () => { pb.collection("benefits").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

  const createBenefit = useCallback(async (data: {
    title: string; description: string; details: string;
    category: string; icon: string; link: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("benefits").create({ ...data, author: pb.authStore.record!.id });
  }, []);

  const deleteBenefit = useCallback(async (id: string) => {
    const pb = getPocketBase();
    await pb.collection("benefits").delete(id);
    setBenefits((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { benefits, loading, createBenefit, deleteBenefit };
}
