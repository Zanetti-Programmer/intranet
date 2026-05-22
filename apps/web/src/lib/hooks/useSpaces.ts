"use client";
import { useEffect, useState } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Space } from "@/types";

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    pb.collection("spaces")
      .getFullList({ sort: "name" })
      .then((items) => setSpaces(items as unknown as Space[]))
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, []);

  return { spaces, loading };
}
