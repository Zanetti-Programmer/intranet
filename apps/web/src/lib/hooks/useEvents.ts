"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Space } from "@/types";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  all_day: boolean;
  color?: string;
  space?: string;
  author: string;
  expand?: { space?: Space };
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("events").getFullList({
        sort: "start", expand: "space",
      });
      setEvents(items as unknown as CalendarEvent[]);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const pb = getPocketBase();
    pb.collection("events").subscribe("*", (e) => {
      if (e.action === "create") setEvents((p) => [...p, e.record as unknown as CalendarEvent]);
      else if (e.action === "delete") setEvents((p) => p.filter((ev) => ev.id !== e.record.id));
      else if (e.action === "update") setEvents((p) => p.map((ev) => ev.id === e.record.id ? { ...ev, ...e.record } as CalendarEvent : ev));
    }).catch(() => {});
    return () => { pb.collection("events").unsubscribe("*").catch(() => {}); };
  }, [fetch]);

  const createEvent = useCallback(async (data: Omit<CalendarEvent, "id" | "author" | "expand">) => {
    const pb = getPocketBase();
    await pb.collection("events").create({ ...data, author: pb.authStore.record!.id });
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await getPocketBase().collection("events").delete(id);
  }, []);

  return { events, loading, createEvent, deleteEvent };
}
