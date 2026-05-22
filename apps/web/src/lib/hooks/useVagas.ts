"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { JobPosting, JobApplication } from "@/types";

export function useVagas() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    const userId = pb.authStore.record!.id;
    try {
      const [jobList, appList] = await Promise.all([
        pb.collection("job_postings").getFullList({ sort: "-created", expand: "author" }),
        pb.collection("job_applications").getFullList({ filter: `user = "${userId}"` }),
      ]);
      setJobs(jobList as unknown as JobPosting[]);
      setMyApplications(appList as unknown as JobApplication[]);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("job_postings").subscribe("*", () => fetchAll()).catch(() => {});
    pb.collection("job_applications").subscribe("*", () => fetchAll()).catch(() => {});
    return () => {
      pb.collection("job_postings").unsubscribe("*").catch(() => {});
      pb.collection("job_applications").unsubscribe("*").catch(() => {});
    };
  }, [fetchAll]);

  const createJob = useCallback(async (data: {
    title: string; department: string; description: string;
    requirements: string; type: string; deadline: string;
  }) => {
    const pb = getPocketBase();
    await pb.collection("job_postings").create({
      ...data, status: "aberta", author: pb.authStore.record!.id,
    });
  }, []);

  const applyToJob = useCallback(async (jobId: string, message: string) => {
    const pb = getPocketBase();
    await pb.collection("job_applications").create({
      job: jobId, user: pb.authStore.record!.id, message, status: "inscrito",
    });
  }, []);

  const toggleJobStatus = useCallback(async (jobId: string, current: string) => {
    const pb = getPocketBase();
    await pb.collection("job_postings").update(jobId, {
      status: current === "aberta" ? "encerrada" : "aberta",
    });
  }, []);

  const hasApplied = useCallback((jobId: string) =>
    myApplications.some((a) => a.job === jobId), [myApplications]);

  return { jobs, myApplications, loading, createJob, applyToJob, toggleJobStatus, hasApplied };
}

export function useJobApplications(jobId: string) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    pb.collection("job_applications").getFullList({
      filter: `job = "${jobId}"`, expand: "user", sort: "-created",
    }).then((r) => setApplications(r as unknown as JobApplication[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  const updateStatus = useCallback(async (appId: string, status: string) => {
    const pb = getPocketBase();
    await pb.collection("job_applications").update(appId, { status });
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: status as JobApplication["status"] } : a));
  }, []);

  return { applications, loading, updateStatus };
}
