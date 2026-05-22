"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { WallCard } from "@/types";

export function useMural() {
  const [cards, setCards] = useState<WallCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("wall_cards").getFullList({
        sort: "-created", expand: "author,recipient",
      });
      setCards(items as unknown as WallCard[]);
    } catch { setCards([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("wall_cards").subscribe("*", (e) => {
      if (e.action === "create") fetchAll();
      else if (e.action === "delete")
        setCards((prev) => prev.filter((c) => c.id !== e.record.id));
    }).catch(() => {});
    return () => { pb.collection("wall_cards").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

  const createCard = useCallback(async (data: {
    message: string; type: string; emoji: string; recipient?: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("wall_cards").create({
      ...data, author: pb.authStore.record!.id,
    });
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    await getPocketBase().collection("wall_cards").delete(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { cards, loading, createCard, deleteCard };
}
