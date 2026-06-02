"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Space, User } from "@/types";

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
  visibility: "publico" | "privado" | "convidados" | "";
  attendees?: string[];
  expand?: { space?: Space; attendees?: User[] };
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("events").getFullList({
        sort: "start", expand: "space,attendees",
      });
      setEvents(items as unknown as CalendarEvent[]);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const pb = getPocketBase();
    pb.collection("events").subscribe("*", () => fetch()).catch(() => {});
    return () => { pb.collection("events").unsubscribe("*").catch(() => {}); };
  }, [fetch]);

  const createEvent = useCallback(async (data: Omit<CalendarEvent, "id" | "author" | "expand">) => {
    const pb = getPocketBase();
    await pb.collection("events").create({ ...data, author: pb.authStore.record!.id });
  }, []);

  const updateEvent = useCallback(async (id: string, data: Omit<CalendarEvent, "id" | "author" | "expand">) => {
    await getPocketBase().collection("events").update(id, data);
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await getPocketBase().collection("events").delete(id);
  }, []);

  return { events, loading, createEvent, updateEvent, deleteEvent };
}
