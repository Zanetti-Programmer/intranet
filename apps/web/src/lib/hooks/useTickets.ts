"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Ticket, User, PostComment } from "@/types";

export interface TicketComment {
  id: string;
  ticket: string;
  author: string;
  expand?: { author: User };
  content: string;
  created: string;
}

export function useTickets(statusFilter?: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const filter = statusFilter && statusFilter !== "todos"
        ? `status = "${statusFilter}"` : "";
      const items = await pb.collection("tickets").getList(1, 100, {
        sort: "-created", expand: "author,assignee", filter,
      });
      setTickets(items.items as unknown as Ticket[]);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const createTicket = useCallback(async (data: {
    title: string; description: string;
    category: string; priority: string;
  }) => {
    const pb = getPocketBase();
    const ticket = await pb.collection("tickets").create({
      ...data, status: "aberto", author: pb.authStore.record!.id,
    });
    await fetch();
    return ticket.id;
  }, [fetch]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    await getPocketBase().collection("tickets").update(id, { status });
    setTickets((p) => p.map((t) => t.id === id ? { ...t, status: status as Ticket["status"] } : t));
  }, []);

  const assignTicket = useCallback(async (id: string, assigneeId: string) => {
    await getPocketBase().collection("tickets").update(id, { assignee: assigneeId });
    await fetch();
  }, [fetch]);

  return { tickets, loading, createTicket, updateStatus, assignTicket, refetch: fetch };
}

export function useTicketComments(ticketId: string) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("ticket_comments").getFullList({
      filter: `ticket = "${ticketId}"`, sort: "created", expand: "author",
    }).then((r) => setComments(r as unknown as TicketComment[]))
      .catch(() => {}).finally(() => setLoading(false));
  }, [ticketId]);

  const addComment = useCallback(async (content: string) => {
    const pb = getPocketBase();
    const r = await pb.collection("ticket_comments").create(
      { ticket: ticketId, author: pb.authStore.record!.id, content },
      { expand: "author" }
    );
    setComments((p) => [...p, r as unknown as TicketComment]);
  }, [ticketId]);

  return { comments, loading, addComment };
}
