"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Document } from "@/types";

const PAGE_SIZE = 20;

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  const load = useCallback(async (page: number) => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    setLoading(true);
    try {
      const result = await pb.collection("documents").getList(page, PAGE_SIZE, {
        sort: "-created", expand: "author",
      });
      if (page === 1) {
        setDocuments(result.items as unknown as Document[]);
      } else {
        setDocuments((prev) => [...prev, ...result.items as unknown as Document[]]);
      }
      setHasMore(result.totalPages > page);
      pageRef.current = page;
    } catch {
      if (page === 1) setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    load(pageRef.current + 1);
  }, [load]);

  useEffect(() => {
    load(1);
    const pb = getPocketBase();
    pb.collection("documents").subscribe("*", (e) => {
      if (e.action === "create") load(1);
      else if (e.action === "delete") {
        setDocuments((prev) => prev.filter((d) => d.id !== e.record.id));
      }
    }).catch((err) => console.error("[realtime] documents:", err));
    return () => { pb.collection("documents").unsubscribe("*").catch(() => {}); };
  }, [load]);

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

  return { documents, loading, hasMore, loadMore, createDocument };
}
