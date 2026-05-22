"use client";
import { useEffect, useState } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Announcement } from "@/types";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;

    const today = new Date().toISOString();
    pb.collection("announcements")
      .getFullList({
        sort: "-created",
        expand: "author",
        filter: `pinned = true && (expires = "" || expires >= "${today}")`,
      })
      .then((r) => setAnnouncements(r as unknown as Announcement[]))
      .catch(() => {});
  }, []);

  return { announcements };
}
