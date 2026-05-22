"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useChannels } from "@/lib/hooks/useChannels";
import type { User } from "@/types";
import getPocketBase from "@/lib/pocketbase";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<string, { label: string; class: string }> = {
  admin: { label: "Admin",    class: "bg-purple-500/15 text-purple-400" },
  rh:    { label: "RH",       class: "bg-red-500/15 text-red-400" },
  ti:    { label: "TI",       class: "bg-blue-500/15 text-blue-400" },
  user:  { label: "Usuário",  class: "bg-muted text-muted-foreground" },
};

export default function PessoasPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { createDM } = useChannels();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Todos");
  const myId = getPocketBase().authStore.record?.id;

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getFullList({ sort: "name" })
      .then((r) => setUsers(r as unknown as User[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const departments = ["Todos", ...Array.from(new Set(users.map((u) => u.department).filter(Boolean) as string[]))];

  const filtered = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "Todos" || u.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  async function handleDM(userId: string) {
    const channelId = await createDM(userId);
    router.push(`/chat/${channelId}`);
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Pessoas</h1>
            <p className="text-sm text-muted-foreground">{users.length} colaboradores</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou departamento..." className="pl-9 h-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {departments.map((d) => (
              <button key={d} onClick={() => setDeptFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deptFilter === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-3xl">👥</p>
            <p className="font-medium">Nenhuma pessoa encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((user, i) => {
              const role = ROLE_BADGE[user.role] ?? ROLE_BADGE.user;
              return (
                <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors group">
                  <UserAvatar user={user} size="lg" />
                  <div className="w-full">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    {user.department && <p className="text-xs text-muted-foreground truncate mt-0.5">{user.department}</p>}
                    <span className={cn("inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium", role.class)}>
                      {role.label}
                    </span>
                  </div>
                  {user.bio && <p className="text-[11px] text-muted-foreground line-clamp-2 w-full">{user.bio}</p>}
                  {user.id !== myId && (
                    <button onClick={() => void handleDM(user.id)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all py-1 rounded-lg hover:bg-primary/10">
                      <MessageSquare className="w-3.5 h-3.5" /> Conversar
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
