"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Poll, PollVote } from "@/types";

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [myVotes, setMyVotes] = useState<PollVote[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    const userId = pb.authStore.record!.id;
    try {
      const [pollList, voteList] = await Promise.all([
        pb.collection("polls").getFullList({ sort: "-created", expand: "author" }),
        pb.collection("poll_votes").getFullList({ filter: `user = "${userId}"` }),
      ]);
      const allVotes = await pb.collection("poll_votes").getFullList({});
      setPolls(pollList as unknown as Poll[]);
      setMyVotes(voteList as unknown as PollVote[]);

      // Build vote counts per poll per option
      const counts: Record<string, number[]> = {};
      (pollList as unknown as Poll[]).forEach((poll) => {
        counts[poll.id] = new Array(poll.options.length).fill(0);
      });
      (allVotes as unknown as PollVote[]).forEach((v) => {
        if (counts[v.poll]) counts[v.poll][v.option_idx] = (counts[v.poll][v.option_idx] || 0) + 1;
      });
      setVoteCounts(counts);
    } catch { setPolls([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("polls").subscribe("*", () => fetchAll()).catch(() => {});
    pb.collection("poll_votes").subscribe("*", () => fetchAll()).catch(() => {});
    return () => {
      pb.collection("polls").unsubscribe("*").catch(() => {});
      pb.collection("poll_votes").unsubscribe("*").catch(() => {});
    };
  }, [fetchAll]);

  const createPoll = useCallback(async (data: {
    question: string; options: string[]; deadline: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("polls").create({
      question: data.question,
      options: data.options,
      deadline: data.deadline || null,
      status: "ativa",
      author: pb.authStore.record!.id,
    });
  }, []);

  const vote = useCallback(async (pollId: string, optionIdx: number) => {
    const pb = getPocketBase();
    await pb.collection("poll_votes").create({
      poll: pollId, user: pb.authStore.record!.id, option_idx: optionIdx,
    });
  }, []);

  const closePoll = useCallback(async (id: string) => {
    await getPocketBase().collection("polls").update(id, { status: "encerrada" });
    fetchAll();
  }, [fetchAll]);

  const hasVoted = useCallback((pollId: string) =>
    myVotes.some((v) => v.poll === pollId), [myVotes]);

  const getVotedIdx = useCallback((pollId: string) =>
    myVotes.find((v) => v.poll === pollId)?.option_idx ?? -1, [myVotes]);

  const totalVotes = useCallback((pollId: string) =>
    (voteCounts[pollId] ?? []).reduce((s, c) => s + c, 0), [voteCounts]);

  return { polls, loading, voteCounts, createPoll, vote, closePoll, hasVoted, getVotedIdx, totalVotes };
}
