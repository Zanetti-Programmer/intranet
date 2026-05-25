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
    pb.collection("benefits").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
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
    const prev = benefits;
    setBenefits((p) => p.filter((b) => b.id !== id));
    try {
      await getPocketBase().collection("benefits").delete(id);
    } catch (err) {
      setBenefits(prev);
      throw err;
    }
  }, [benefits]);

  return { benefits, loading, createBenefit, deleteBenefit };
}
