"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Task } from "@/types";

export function useTasks(view: "minhas" | "time" | "criadas") {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    const userId = pb.authStore.record!.id;
    const filter =
      view === "minhas"  ? `assignee = "${userId}"` :
      view === "time"    ? `is_team = true` :
                           `created_by = "${userId}"`;
    try {
      const items = await pb.collection("tasks").getFullList({
        sort: "status,-created", expand: "assignee,created_by", filter,
      });
      setTasks(items as unknown as Task[]);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [view]);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("tasks").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
    return () => { pb.collection("tasks").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);

  const createTask = useCallback(async (data: {
    title: string; description: string; assignee: string;
    due_date: string; priority: string; is_team: boolean;
  }) => {
    const pb = getPocketBase();
    const myId = pb.authStore.record!.id;
    await pb.collection("tasks").create({
      ...data, status: "pendente", created_by: myId,
    });
    // Notify assignee (skip self-assignment)
    if (data.assignee && data.assignee !== myId) {
      pb.collection("notifications").create({
        user: data.assignee, type: "task_assigned",
        content: `Nova tarefa atribuída a você: "${data.title}"`,
        read: false, link: "/tarefas",
      }).catch(() => {});
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: Task["status"]) => {
    await getPocketBase().collection("tasks").update(id, { status });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await getPocketBase().collection("tasks").delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, createTask, updateStatus, deleteTask };
}
