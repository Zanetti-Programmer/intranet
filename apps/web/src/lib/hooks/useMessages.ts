"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Message, TypingStatus, User } from "@/types";

const PAGE_SIZE = 50;

function dedup<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => seen.has(item.id) ? false : (seen.add(item.id), true));
}

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  useEffect(() => {
    if (!channelId) return;
    const pb = getPocketBase();
    let cancelled = false;

    setLoading(true);
    setMessages([]);
    pageRef.current = 1;

    pb.collection("messages").getList(1, PAGE_SIZE, {
      filter: `channel = "${channelId}"`,
      sort: "created",
      expand: "author",
    }).then((result) => {
      if (cancelled) return;
      setMessages(result.items as unknown as Message[]);
      setHasMore(result.totalItems > PAGE_SIZE);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });

    pb.collection("messages").subscribe("*", async (e) => {
      if (cancelled) return;
      if (e.record.channel !== channelId) return;

      if (e.action === "create") {
        try {
          const full = await pb.collection("messages").getOne(e.record.id, { expand: "author" });
          if (cancelled) return;
          setMessages((prev) => dedup([...prev, full as unknown as Message]));
        } catch {}
      } else if (e.action === "delete") {
        setMessages((prev) => prev.filter((m) => m.id !== e.record.id));
      } else if (e.action === "update") {
        setMessages((prev) =>
          prev.map((m) => m.id === e.record.id ? { ...m, ...e.record } as Message : m)
        );
      }
    }).catch((e) => console.error("[realtime] messages:", e));

    return () => {
      cancelled = true;
      pb.collection("messages").unsubscribe("*").catch(() => {});
    };
  }, [channelId]);

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!channelId) return;
    const pb = getPocketBase();
    const formData = new FormData();
    formData.append("channel", channelId);
    formData.append("author", pb.authStore.record!.id);
    if (content.trim()) formData.append("content", content.trim());
    files?.forEach((f) => formData.append("attachments", f));
    await pb.collection("messages").create(formData);
  }, [channelId]);

  const deleteMessage = useCallback(async (id: string) => {
    await getPocketBase().collection("messages").delete(id);
  }, []);

  const loadMore = useCallback(async () => {
    if (!channelId || !hasMore) return;
    const pb = getPocketBase();
    pageRef.current += 1;
    const result = await pb.collection("messages").getList(pageRef.current, PAGE_SIZE, {
      filter: `channel = "${channelId}"`,
      sort: "created",
      expand: "author",
    });
    setMessages((prev) => dedup([...result.items as unknown as Message[], ...prev]));
    setHasMore(result.totalPages > pageRef.current);
  }, [channelId, hasMore]);

  return { messages, loading, sendMessage, deleteMessage, loadMore, hasMore };
}

// ── Typing Status ─────────────────────────────────────────────────────────────
export function useTyping(channelId: string | null) {
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const recordIdRef = useRef<string | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!channelId) return;
    const pb = getPocketBase();
    const myId = pb.authStore.record?.id;
    let cancelled = false;

    pb.collection("typing_status").subscribe("*", async (e) => {
      if (cancelled) return;
      if (e.record.channel !== channelId) return;

      if (e.action === "delete" || e.action === "create" || e.action === "update") {
        try {
          const cutoff = new Date(Date.now() - 4000).toISOString().replace("T", " ").slice(0, 19);
          const records = await pb.collection("typing_status").getFullList({
            filter: `channel = "${channelId}" && user != "${myId}" && updated >= "${cutoff}"`,
            expand: "user",
          });
          if (!cancelled) {
            setTypingUsers(records.map((r) => r.expand?.user).filter(Boolean) as unknown as User[]);
          }
        } catch {}
      }
    }).catch((e) => console.error("[realtime] typing_status:", e));

    return () => {
      cancelled = true;
      pb.collection("typing_status").unsubscribe("*").catch(() => {});
      if (recordIdRef.current) {
        pb.collection("typing_status").delete(recordIdRef.current).catch(() => {});
        recordIdRef.current = null;
      }
    };
  }, [channelId]);

  const notifyTyping = useCallback(async () => {
    if (!channelId) return;
    const pb = getPocketBase();
    const myId = pb.authStore.record?.id;
    if (!myId) return;

    clearTimeout(timeoutRef.current);

    try {
      if (!recordIdRef.current) {
        const r = await pb.collection("typing_status").create({ channel: channelId, user: myId });
        recordIdRef.current = r.id;
      } else {
        await pb.collection("typing_status").update(recordIdRef.current, { user: myId });
      }
    } catch {
      recordIdRef.current = null;
    }

    timeoutRef.current = setTimeout(async () => {
      if (recordIdRef.current) {
        await getPocketBase().collection("typing_status").delete(recordIdRef.current).catch(() => {});
        recordIdRef.current = null;
      }
    }, 3000);
  }, [channelId]);

  const stopTyping = useCallback(async () => {
    clearTimeout(timeoutRef.current);
    if (recordIdRef.current) {
      await getPocketBase().collection("typing_status").delete(recordIdRef.current).catch(() => {});
      recordIdRef.current = null;
    }
  }, []);

  return { typingUsers, notifyTyping, stopTyping };
}
