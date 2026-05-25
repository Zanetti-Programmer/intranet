"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@/types";

const ROLES = ["user", "rh", "ti", "admin"] as const;
const ROLE_LABELS: Record<string, string> = { user: "Usuário", rh: "RH", ti: "TI", admin: "Admin" };
const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-500/15 text-purple-400",
  rh:    "bg-pink-500/15 text-pink-400",
  ti:    "bg-blue-500/15 text-blue-400",
  user:  "bg-muted text-muted-foreground",
};

export default function AdminPage() {
  const pathname = usePathname();
  const router = useRouter();
  const pb = getPocketBase();
  const myRole = (pb.authStore.record as { role?: string })?.role;

  useEffect(() => {
    if (pb.authStore.isValid && myRole && myRole !== "admin") router.replace("/");
  }, [myRole, router, pb]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [editDept, setEditDept] = useState<Record<string, string>>({});

  useEffect(() => {
    if (myRole !== "admin") return;
    pb.collection("users").getFullList({ sort: "name" })
      .then((r) => {
        const list = r as unknown as User[];
        setUsers(list);
        const depts: Record<string, string> = {};
        list.forEach((u) => { depts[u.id] = u.department ?? ""; });
        setEditDept(depts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [myRole]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateRole(userId: string, role: string) {
    setSaving(userId + "-role");
    try {
      await pb.collection("users").update(userId, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: role as User["role"] } : u));
      toast.success("Role atualizada!");
    } catch {
      toast.error("Erro ao atualizar role.");
    } finally {
      setSaving(null);
    }
  }

  async function updateDept(userId: string) {
    const dept = editDept[userId] ?? "";
    setSaving(userId + "-dept");
    try {
      await pb.collection("users").update(userId, { department: dept });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, department: dept } : u));
      toast.success("Departamento salvo!");
    } catch {
      toast.error("Erro ao salvar departamento.");
    } finally {
      setSaving(null);
    }
  }

  if (!myRole || myRole !== "admin") return null;

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Painel Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerenciar usuários, roles e departamentos
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou departamento..." className="pl-9 h-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Usuário</th>
                    <th className="text-left px-4 py-3 font-medium">E-mail</th>
                    <th className="text-left px-4 py-3 font-medium w-[130px]">Role</th>
                    <th className="text-left px-4 py-3 font-medium w-[180px]">Departamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u, i) => (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={u} size="sm" />
                          <span className="font-medium truncate max-w-[160px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={saving === u.id + "-role"}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className={cn(
                            "w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
                            ROLE_BADGE[u.role]
                          )}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editDept[u.id] ?? ""}
                          onChange={(e) => setEditDept((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          onBlur={() => {
                            if ((editDept[u.id] ?? "") !== (u.department ?? "")) updateDept(u.id);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
                          placeholder="Departamento"
                          className="h-8 text-xs"
                          disabled={saving === u.id + "-dept"}
                        />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
              {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
