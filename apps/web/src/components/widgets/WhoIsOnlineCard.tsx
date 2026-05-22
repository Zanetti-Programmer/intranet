"use client";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import getPocketBase from "@/lib/pocketbase";
import type { User } from "@/types";

export function WhoIsOnlineCard() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getList(1, 8, { sort: "-created" })
      .then((r) => setUsers(r.items as unknown as User[]))
      .catch(() => {});
  }, []);

  if (!users.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Who&apos;s Online</h3>
      </div>
      <div className="border-t border-border/60" />

      <div className="px-5 py-4 flex flex-wrap gap-3">
        {users.map((u, i) => (
          <div key={u.id} className="relative">
            <UserAvatar user={u} size="lg" className="w-14 h-14 rounded-full" />
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
              i < 3 ? "bg-green-500" : "bg-muted-foreground/30"
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
}
