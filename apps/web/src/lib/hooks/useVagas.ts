"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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
    pb.collection("job_postings").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
    pb.collection("job_applications").subscribe("*", () => fetchAll()).catch((e) => console.error("[realtime]", e));
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
    const newStatus = current === "aberta" ? "encerrada" : "aberta";
    const prev = jobs;
    setJobs((p) => p.map((j) => j.id === jobId ? { ...j, status: newStatus as JobPosting["status"] } : j));
    try {
      await getPocketBase().collection("job_postings").update(jobId, { status: newStatus });
    } catch (err) {
      setJobs(prev);
      throw err;
    }
  }, [jobs]);

  const hasApplied = useCallback((jobId: string) =>
    myApplications.some((a) => a.job === jobId), [myApplications]);

  return { jobs, myApplications, loading, createJob, applyToJob, toggleJobStatus, hasApplied };
}

const APPS_PAGE_SIZE = 25;

export function useJobApplications(jobId: string) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  const load = useCallback(async (page: number) => {
    const pb = getPocketBase();
    setLoading(true);
    try {
      const result = await pb.collection("job_applications").getList(page, APPS_PAGE_SIZE, {
        filter: `job = "${jobId}"`, expand: "user", sort: "-created",
      });
      if (page === 1) {
        setApplications(result.items as unknown as JobApplication[]);
      } else {
        setApplications((prev) => [...prev, ...result.items as unknown as JobApplication[]]);
      }
      setHasMore(result.totalPages > page);
      pageRef.current = page;
    } catch {
      if (page === 1) setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(1); }, [load]);

  const loadMore = useCallback(() => { load(pageRef.current + 1); }, [load]);

  const updateStatus = useCallback(async (appId: string, status: string) => {
    const prev = applications;
    setApplications((p) => p.map((a) => a.id === appId ? { ...a, status: status as JobApplication["status"] } : a));
    try {
      await getPocketBase().collection("job_applications").update(appId, { status });
    } catch (err) {
      setApplications(prev);
      throw err;
    }
  }, [applications]);

  return { applications, loading, hasMore, loadMore, updateStatus };
}
