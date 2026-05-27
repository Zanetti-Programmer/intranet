"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useChannels } from "@/lib/hooks/useChannels";
import type { User } from "@/types";
import getPocketBase from "@/lib/pocketbase";
import { Search, MessageSquare, Loader2, X, Mail, Phone, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<string, { label: string; class: string }> = {
  admin: { label: "Admin",    class: "bg-purple-500/15 text-purple-400" },
  rh:    { label: "RH",       class: "bg-red-500/15 text-red-400" },
  ti:    { label: "TI",       class: "bg-blue-500/15 text-blue-400" },
  user:  { label: "Usuário",  class: "bg-muted text-muted-foreground" },
};

function ProfileModal({ user, onClose, onDM }: { user: User; onClose: () => void; onDM: () => void }) {
  const role = ROLE_BADGE[user.role] ?? ROLE_BADGE.user;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-black/20 text-white hover:bg-black/40 transition-colors">
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Avatar overlapping cover */}
        <div className="px-5 pb-5">
          <div className="-mt-10 mb-3">
            <UserAvatar user={user} size="lg" className="ring-4 ring-card" />
          </div>

          <div className="space-y-1 mb-4">
            <h2 className="font-bold text-lg leading-tight">{user.name}</h2>
            <span className={cn("inline-block text-[11px] px-2 py-0.5 rounded-full font-medium", role.class)}>
              {role.label}
            </span>
          </div>

          {user.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 border-t border-border/50 pt-3">{user.bio}</p>
          )}

          <div className="space-y-2 text-sm">
            {user.department && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 style={{ width: 14, height: 14 }} className="shrink-0" />
                <span>{user.department}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail style={{ width: 14, height: 14 }} className="shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone style={{ width: 14, height: 14 }} className="shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>

          <button onClick={onDM}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <MessageSquare style={{ width: 14, height: 14 }} /> Enviar mensagem
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PessoasPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { createDM } = useChannels();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const myId = getPocketBase().authStore.record?.id;
  const pageRef = useRef(1);
  const PAGE_SIZE = 100;

  const loadPage = useCallback(async (page: number) => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    setLoading(true);
    try {
      const result = await pb.collection("users").getList(page, PAGE_SIZE, { sort: "name" });
      if (page === 1) {
        setUsers(result.items as unknown as User[]);
      } else {
        setUsers((prev) => [...prev, ...result.items as unknown as User[]]);
      }
      setHasMore(result.totalPages > page);
      pageRef.current = page;
    } catch {
      if (page === 1) setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [PAGE_SIZE]);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const departments = ["Todos", ...Array.from(new Set(users.map((u) => u.department).filter(Boolean) as string[]))];

  const filtered = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "Todos" || u.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  async function handleDM(userId: string) {
    const channelId = await createDM(userId);
    setSelectedUser(null);
    router.push(`/chat/${channelId}`);
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Pessoas</h1>
            <p className="text-sm text-muted-foreground">{users.length}{hasMore ? "+" : ""} colaboradores</p>
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((user, i) => {
                const role = ROLE_BADGE[user.role] ?? ROLE_BADGE.user;
                return (
                  <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedUser(user)}
                    className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors group cursor-pointer">
                    <UserAvatar user={user} size="lg" />
                    <div className="w-full">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      {user.department && <p className="text-xs text-muted-foreground truncate mt-0.5">{user.department}</p>}
                      <span className={cn("inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium", role.class)}>
                        {role.label}
                      </span>
                    </div>
                    {user.bio && <p className="text-[11px] text-muted-foreground line-clamp-2 w-full">{user.bio}</p>}
                  </motion.div>
                );
              })}
            </div>
            {hasMore && !search.trim() && deptFilter === "Todos" && (
              <div className="flex justify-center pt-4">
                <button onClick={() => loadPage(pageRef.current + 1)} disabled={loading}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  {loading ? "Carregando..." : "Carregar mais"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && selectedUser.id !== myId && (
          <ProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onDM={() => void handleDM(selectedUser.id)}
          />
        )}
        {selectedUser && selectedUser.id === myId && (
          <ProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onDM={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
