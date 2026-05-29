"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { MarketplaceItem } from "@/types";

export function useClassifieds(statusFilter?: string) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const filter = statusFilter && statusFilter !== "todos"
        ? `status = "${statusFilter}"` : "";
      const result = await pb.collection("marketplace_items").getFullList({
        sort: "-created", expand: "author", filter,
      });
      setItems(result as unknown as MarketplaceItem[]);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => {
    fetch();
    const pb = getPocketBase();
    pb.collection("marketplace_items").subscribe("*", (e) => {
      if (e.action === "create") fetch();
      else if (e.action === "delete") setItems((p) => p.filter((i) => i.id !== e.record.id));
      else if (e.action === "update") setItems((p) => p.map((i) => i.id === e.record.id ? { ...i, ...e.record } as MarketplaceItem : i));
    }).catch(() => {});
    return () => { pb.collection("marketplace_items").unsubscribe("*").catch(() => {}); };
  }, [fetch]);

  const createItem = useCallback(async (data: {
    title: string; description: string; price: number;
    category: string; condition?: string; contact_dm: boolean; photos?: File[];
  }) => {
    const pb = getPocketBase();
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("price", String(data.price));
    formData.append("category", data.category);
    if (data.condition) formData.append("condition", data.condition);
    formData.append("contact_dm", String(data.contact_dm));
    formData.append("status", "disponivel");
    formData.append("author", pb.authStore.record!.id);
    data.photos?.forEach((f) => formData.append("photos", f));
    await pb.collection("marketplace_items").create(formData);
    await fetch();
  }, [fetch]);

  const updateStatus = useCallback(async (id: string, status: MarketplaceItem["status"]) => {
    await getPocketBase().collection("marketplace_items").update(id, { status });
  }, []);

  const updateItem = useCallback(async (id: string, data: {
    title: string; description: string; price: number; category: string; condition?: string;
  }) => {
    await getPocketBase().collection("marketplace_items").update(id, data);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await getPocketBase().collection("marketplace_items").delete(id);
  }, []);

  return { items, loading, createItem, updateStatus, updateItem, deleteItem };
}
