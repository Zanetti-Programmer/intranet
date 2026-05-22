"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Achievement, User } from "@/types";

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("achievements").getFullList({
        sort: "-date,-created", expand: "recipient,author",
      });
      setAchievements(items as unknown as Achievement[]);
    } catch { setAchievements([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const pb = getPocketBase();
    pb.collection("achievements").subscribe("*", async (e) => {
      if (e.action === "create") {
        try {
          const full = await pb.collection("achievements").getOne(e.record.id, { expand: "recipient,author" });
          setAchievements((p) => [full as unknown as Achievement, ...p]);
        } catch {}
      } else if (e.action === "delete") {
        setAchievements((p) => p.filter((a) => a.id !== e.record.id));
      }
    }).catch(() => {});
    return () => { pb.collection("achievements").unsubscribe("*").catch(() => {}); };
  }, [fetch]);

  const createAchievement = useCallback(async (data: {
    title: string; description?: string;
    recipient: string; icon: string; date: string; public: boolean;
  }) => {
    const pb = getPocketBase();
    const achievement = await pb.collection("achievements").create({
      ...data, author: pb.authStore.record!.id,
    });
    // Create notification for recipient
    await pb.collection("notifications").create({
      user: data.recipient,
      type: "achievement",
      content: `Você recebeu o badge "${data.title}"! 🏆`,
      read: false,
      link: "/conquistas",
    }).catch(() => {});
    return achievement.id;
  }, []);

  return { achievements, loading, createAchievement };
}

export function useNotifications() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<{
    id: string; type: string; content: string; read: boolean; link?: string; created: string;
  }[]>([]);

  useEffect(() => {
    const pb = getPocketBase();
    const userId = pb.authStore.record?.id;
    if (!userId) return;

    pb.collection("notifications").getFullList({
      filter: `user = "${userId}"`, sort: "-created",
    }).then((r) => {
      setNotifications(r as unknown as typeof notifications);
      setCount(r.filter((n) => !n.read).length);
    }).catch(() => {});

    pb.collection("notifications").subscribe("*", (e) => {
      if (e.record.user !== userId) return;
      if (e.action === "create") {
        setNotifications((p) => [e.record as unknown as (typeof notifications)[0], ...p]);
        setCount((c) => c + 1);
      } else if (e.action === "update") {
        setNotifications((p) => p.map((n) => n.id === e.record.id ? { ...n, ...e.record } : n));
        setCount((c) => e.record.read ? Math.max(0, c - 1) : c);
      }
    }).catch(() => {});

    return () => { pb.collection("notifications").unsubscribe("*").catch(() => {}); };
  }, []);

  const markAllRead = useCallback(async () => {
    const pb = getPocketBase();
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => pb.collection("notifications").update(n.id, { read: true }).catch(() => {})));
    setCount(0);
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  return { count, notifications, markAllRead };
}
