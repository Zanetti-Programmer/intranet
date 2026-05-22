"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Announcement } from "@/types";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("announcements").getFullList({
        sort: "-pinned,-created",
        expand: "author",
      });
      setAnnouncements(items as unknown as Announcement[]);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("announcements").subscribe("*", async (e) => {
      if (e.action === "create") {
        try {
          const full = await pb.collection("announcements").getOne(e.record.id, { expand: "author" });
          setAnnouncements((prev) => {
            const next = [full as unknown as Announcement, ...prev];
            return next.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
          });
        } catch {}
      } else if (e.action === "delete") {
        setAnnouncements((prev) => prev.filter((a) => a.id !== e.record.id));
      } else if (e.action === "update") {
        fetchAll();
      }
    }).catch(() => {});
    return () => {
      pb.collection("announcements").unsubscribe("*").catch(() => {});
    };
  }, [fetchAll]);

  const createAnnouncement = useCallback(async (data: {
    title: string;
    body: string;
    category: string;
    priority: string;
    pinned: boolean;
  }) => {
    const pb = getPocketBase();
    await pb.collection("announcements").create({
      title: data.title,
      content: data.body,
      category: data.category,
      priority: data.priority,
      pinned: data.pinned,
      author: pb.authStore.record!.id,
    });
  }, []);

  return { announcements, loading, createAnnouncement };
}
