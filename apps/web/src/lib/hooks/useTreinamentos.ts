"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Training, TrainingCompletion } from "@/types";

export function useTrainings() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    const userId = pb.authStore.record!.id;
    try {
      const [list, done] = await Promise.all([
        pb.collection("trainings").getFullList({ sort: "category,title", expand: "author" }),
        pb.collection("training_completions").getFullList({ filter: `user = "${userId}"` }),
      ]);
      setTrainings(list as unknown as Training[]);
      setCompletions(done as unknown as TrainingCompletion[]);
    } catch { setTrainings([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("trainings").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
    pb.collection("training_completions").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
    return () => {
      pb.collection("trainings").unsubscribe("*").catch(() => {});
      pb.collection("training_completions").unsubscribe("*").catch(() => {});
    };
  }, [fetchAll]);

  const createTraining = useCallback(async (data: {
    title: string; description: string; video_url: string;
    duration: string; category: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("trainings").create({ ...data, author: pb.authStore.record!.id });
  }, []);

  const markComplete = useCallback(async (trainingId: string) => {
    const pb = getPocketBase();
    await pb.collection("training_completions").create({
      training: trainingId, user: pb.authStore.record!.id,
    });
  }, []);

  const isCompleted = useCallback((trainingId: string) =>
    completions.some((c) => c.training === trainingId), [completions]);

  return { trainings, completions, loading, createTraining, markComplete, isCompleted };
}
