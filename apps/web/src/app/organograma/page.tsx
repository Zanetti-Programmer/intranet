"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Loader2, GitBranch, MessageSquare, Info, Pencil, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function OrgCardSkeleton() {
  return (
    <div className="w-[120px] bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-4 w-10 rounded-full" />
    </div>
  );
}
import { toast } from "sonner";
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

function ManagerModal({ user, allUsers, onSave, onClose }: {
  user: UserWithManager; allUsers: UserWithManager[];
  onSave: (userId: string, managerId: string) => Promise<void>; onClose: () => void;
}) {
  const [selected, setSelected] = useState(user.manager ?? "");
  const [saving, setSaving] = useState(false);
  const options = allUsers.filter((u) => u.id !== user.id);

  async function save() {
    setSaving(true);
    try { await onSave(user.id, selected); onClose(); }
    catch { toast.error("Erro ao salvar."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Gerente de {user.name}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">— Sem gerente (raiz) —</option>
          {options.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.department || u.role})</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={() => void save()} disabled={saving}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrgNode({ node, onDM, onEditManager, canAdmin, depth = 0 }: {
  node: TreeNode; onDM: (id: string) => void;
  onEditManager: (user: UserWithManager) => void;
  canAdmin: boolean; depth?: number;
}) {
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
        <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAdmin && (
            <button onClick={() => onEditManager(node.user)}
              className="w-5 h-5 rounded bg-muted text-muted-foreground hover:text-primary flex items-center justify-center" title="Editar gerente">
              <Pencil style={{ width: 9, height: 9 }} />
            </button>
          )}
          {node.user.id !== myId && (
            <button onClick={() => onDM(node.user.id)}
              className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center" title="Enviar mensagem">
              <MessageSquare style={{ width: 9, height: 9 }} />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-start gap-0">
            {node.children.map((child, i) => (
              <div key={child.user.id} className="flex flex-col items-center relative">
                {node.children.length > 1 && (
                  <div className={cn(
                    "h-px bg-border absolute top-0",
                    i === 0 ? "left-1/2 right-0" :
                    i === node.children.length - 1 ? "left-0 right-1/2" :
                    "left-0 right-0"
                  )} />
                )}
                <div className="w-px h-5 bg-border" />
                <OrgNode node={child} onDM={onDM} onEditManager={onEditManager} canAdmin={canAdmin} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeptView({ users, onDM, onEditManager, canAdmin }: {
  users: UserWithManager[]; onDM: (id: string) => void;
  onEditManager: (user: UserWithManager) => void; canAdmin: boolean;
}) {
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
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canAdmin && (
                      <button onClick={() => onEditManager(u)}
                        className="w-5 h-5 rounded bg-muted text-muted-foreground hover:text-primary flex items-center justify-center" title="Editar gerente">
                        <Pencil style={{ width: 9, height: 9 }} />
                      </button>
                    )}
                    {u.id !== myId && (
                      <button onClick={() => onDM(u.id)}
                        className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center" title="Mensagem">
                        <MessageSquare style={{ width: 10, height: 10 }} />
                      </button>
                    )}
                  </div>
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
  const [editingUser, setEditingUser] = useState<UserWithManager | null>(null);

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canAdmin = myRole === "admin" || myRole === "rh";

  function loadUsers() {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getFullList({ sort: "name", expand: "manager" })
      .then((r) => setUsers(r as unknown as UserWithManager[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleDM(userId: string) {
    const channelId = await createDM(userId);
    router.push(`/chat/${channelId}`);
  }

  async function handleSaveManager(userId: string, managerId: string) {
    await getPocketBase().collection("users").update(userId, { manager: managerId || null });
    toast.success("Gerente atualizado.");
    loadUsers();
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
          <div className="flex items-start gap-2.5 bg-muted border border-border rounded-xl p-3 text-sm text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Nenhum gerente configurado — exibindo por departamento. Edite um usuário e defina o campo <strong>Gerente</strong> para ativar a árvore hierárquica.</span>
          </div>
        )}

        {loading ? (
          <div className="flex gap-8 justify-center pt-8">
            {Array.from({length:3}).map((_,i)=>(
              <div key={i} className="flex flex-col items-center gap-2">
                <OrgCardSkeleton />
                {i===1 && <div className="flex gap-4 mt-2">{Array.from({length:3}).map((_,j)=><OrgCardSkeleton key={j}/>)}</div>}
              </div>
            ))}
          </div>
        ) : hasTree ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 justify-start min-w-max px-4 pt-4">
              {tree.map((root, i) => (
                <motion.div key={root.user.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <OrgNode node={root} onDM={handleDM} onEditManager={setEditingUser} canAdmin={canAdmin} />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <DeptView users={users} onDM={handleDM} onEditManager={setEditingUser} canAdmin={canAdmin} />
        )}

        {editingUser && (
          <ManagerModal user={editingUser} allUsers={users}
            onSave={handleSaveManager} onClose={() => setEditingUser(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}
