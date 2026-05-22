"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Loader2, GitBranch, MessageSquare, Info } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { useChannels } from "@/lib/hooks/useChannels";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

type UserWithManager = User & { manager?: string; expand?: { manager?: User } };

type TreeNode = {
  user: UserWithManager;
  children: TreeNode[];
};

function buildTree(users: UserWithManager[]): TreeNode[] {
  const map = new Map<string, UserWithManager>();
  users.forEach((u) => map.set(u.id, u));

  const hasManagers = users.some((u) => u.manager);
  if (!hasManagers) return [];

  const roots: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
  users.forEach((u) => nodeMap.set(u.id, { user: u, children: [] }));

  users.forEach((u) => {
    const node = nodeMap.get(u.id)!;
    if (u.manager && nodeMap.has(u.manager)) {
      nodeMap.get(u.manager)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "Admin",   cls: "bg-purple-500/15 text-purple-400" },
  rh:    { label: "RH",      cls: "bg-pink-500/15 text-pink-400" },
  ti:    { label: "TI",      cls: "bg-blue-500/15 text-blue-400" },
  user:  { label: "Usuário", cls: "bg-muted text-muted-foreground" },
};

function OrgNode({ node, onDM, depth = 0 }: { node: TreeNode; onDM: (id: string) => void; depth?: number }) {
  const badge = ROLE_BADGE[node.user.role] ?? ROLE_BADGE.user;
  const myId = getPocketBase().authStore.record?.id;

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div className={cn(
        "relative group bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 w-[120px] shrink-0",
        "hover:border-primary/40 hover:shadow-md transition-all",
        depth === 0 && "ring-2 ring-primary/30"
      )}>
        <UserAvatar user={node.user} size="md" />
        <div className="text-center">
          <p className="text-xs font-medium leading-tight line-clamp-2">{node.user.name}</p>
          {node.user.department && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{node.user.department}</p>
          )}
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block", badge.cls)}>
            {badge.label}
          </span>
        </div>
        {node.user.id !== myId && (
          <button
            onClick={() => onDM(node.user.id)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Enviar mensagem"
          >
            <MessageSquare style={{ width: 11, height: 11 }} />
          </button>
        )}
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <>
          {/* Vertical line down */}
          <div className="w-px h-5 bg-border" />
          {/* Horizontal line + branches */}
          <div className="flex items-start gap-0">
            {node.children.map((child, i) => (
              <div key={child.user.id} className="flex flex-col items-center relative">
                {/* Horizontal connector */}
                {node.children.length > 1 && (
                  <div className={cn(
                    "h-px bg-border absolute top-0",
                    i === 0 ? "left-1/2 right-0" :
                    i === node.children.length - 1 ? "left-0 right-1/2" :
                    "left-0 right-0"
                  )} />
                )}
                {/* Vertical line to child */}
                <div className="w-px h-5 bg-border" />
                <OrgNode node={child} onDM={onDM} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeptView({ users, onDM }: { users: UserWithManager[]; onDM: (id: string) => void }) {
  const grouped: Record<string, UserWithManager[]> = {};
  users.forEach((u) => {
    const dept = u.department || "Sem departamento";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(u);
  });

  const sorted = Object.entries(grouped).sort(([a], [b]) => {
    const order = ["Liderança", "Diretoria", "Admin"];
    const ai = order.findIndex((o) => a.toLowerCase().includes(o.toLowerCase()));
    const bi = order.findIndex((o) => b.toLowerCase().includes(o.toLowerCase()));
    if (ai >= 0 && bi < 0) return -1;
    if (bi >= 0 && ai < 0) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      {sorted.map(([dept, deptUsers]) => (
        <div key={dept} className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">{dept}
            <span className="ml-2 text-xs text-muted-foreground font-normal">({deptUsers.length})</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {deptUsers.map((u) => {
              const myId = getPocketBase().authStore.record?.id;
              const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.user;
              return (
                <div key={u.id} className="group relative flex flex-col items-center gap-1.5 w-[100px] p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-default">
                  <UserAvatar user={u} size="md" />
                  <p className="text-xs font-medium text-center line-clamp-2 leading-tight">{u.name}</p>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", badge.cls)}>{badge.label}</span>
                  {u.id !== myId && (
                    <button
                      onClick={() => onDM(u.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Mensagem"
                    >
                      <MessageSquare style={{ width: 10, height: 10 }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrganogramaPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { createDM } = useChannels();
  const [users, setUsers] = useState<UserWithManager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getFullList({ sort: "name", expand: "manager" })
      .then((r) => setUsers(r as unknown as UserWithManager[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDM(userId: string) {
    const channelId = await createDM(userId);
    router.push(`/chat/${channelId}`);
  }

  const tree = buildTree(users);
  const hasTree = tree.length > 0;

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Organograma
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Estrutura hierárquica da empresa
          </p>
        </div>

        {!hasTree && !loading && (
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Nenhuma hierarquia configurada ainda. Para ativar a árvore, acesse{" "}
              <code className="bg-amber-500/20 px-1 rounded text-xs">http://localhost/_/</code>{" "}
              → Collections → users → adicionar campo <strong>manager</strong> (Relation → users).
              Por ora, exibindo por departamento.
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : hasTree ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 justify-start min-w-max px-4 pt-4">
              {tree.map((root, i) => (
                <motion.div key={root.user.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <OrgNode node={root} onDM={handleDM} />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <DeptView users={users} onDM={handleDM} />
        )}
      </div>
    </DashboardLayout>
  );
}
