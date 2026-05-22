"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { User } from "@/types";

export function useAuth() {
  const pb = getPocketBase();
  const [user, setUser] = useState<User | null>(
    pb.authStore.isValid ? (pb.authStore.record as unknown as User) : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setUser(
        pb.authStore.isValid
          ? (pb.authStore.record as unknown as User)
          : null
      );
    });
  }, [pb]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        await pb.collection("users").authWithPassword(email, password);
        // authStore agora válido — componentes que usam isValid() vão re-renderizar
      } finally {
        setLoading(false);
      }
    },
    [pb]
  );

  const logout = useCallback(() => {
    pb.authStore.clear();
  }, [pb]);

  return { user, loading, login, logout, pb };
}
