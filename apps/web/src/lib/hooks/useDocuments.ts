"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Document } from "@/types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("documents").getFullList({
        sort: "-created",
        expand: "author",
      });
      setDocuments(items as unknown as Document[]);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("documents").subscribe("*", (e) => {
      if (e.action === "create") fetchAll();
      else if (e.action === "delete") {
        setDocuments((prev) => prev.filter((d) => d.id !== e.record.id));
      }
    }).catch(() => {});
    return () => { pb.collection("documents").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

  const createDocument = useCallback(async (data: {
    title: string;
    description: string;
    category: string;
    file: File;
  }) => {
    const pb = getPocketBase();
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("category", data.category);
    fd.append("file", data.file);
    fd.append("author", pb.authStore.record!.id);
    await pb.collection("documents").create(fd);
  }, []);

  return { documents, loading, createDocument };
}
