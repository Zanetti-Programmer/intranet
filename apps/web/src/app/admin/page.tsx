"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ShieldCheck, Plus, X, Users, Building2, Shield, Trash2, Pencil } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@/types";

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLES = ["user", "rh", "ti", "admin"] as const;
const ROLE_LABELS: Record<string, string> = { user: "Usuário", rh: "RH", ti: "TI", admin: "Admin" };
const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-500/15 text-purple-400",
  rh:    "bg-pink-500/15 text-pink-400",
  ti:    "bg-blue-500/15 text-blue-400",
  user:  "bg-muted text-muted-foreground",
};
const ROLE_INFO = [
  { role: "admin",  label: "Admin",   badge: "bg-purple-500/15 text-purple-400", perms: ["Tudo — acesso irrestrito a todas as funcionalidades", "Criar/excluir qualquer conteúdo", "Gerenciar usuários, roles e departamentos", "Ver relatórios e painel admin"] },
  { role: "rh",     label: "RH",      badge: "bg-pink-500/15 text-pink-400",     perms: ["Criar notícias, blog, avisos, enquetes", "Gerenciar vagas e benefícios", "Ver relatórios", "Encerrar qualquer chamado"] },
  { role: "ti",     label: "TI",      badge: "bg-blue-500/15 text-blue-400",     perms: ["Criar blog, treinamentos, wiki", "Gerenciar e responder chamados de TI", "Recebe e-mail de novos chamados"] },
  { role: "user",   label: "Usuário", badge: "bg-muted text-muted-foreground",   perms: ["Leitura geral de todo o conteúdo", "Criar posts no feed e mural", "Gerenciar próprias tarefas", "Abrir chamados de TI"] },
];

type Dept = { id: string; name: string; description?: string; color?: string };

const DEPT_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16",
];

// ── New User Modal ─────────────────────────────────────────────────────────────

function NewUserModal({ depts, onCreated, onClose }: {
  depts: Dept[];
  onCreated: (u: User) => void;
  onClose: () => void;
}) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<User["role"]>("user");
  const [dept, setDept]         = useState("");
  const [saving, setSaving]     = useState(false);

  async function handleCreate() {
    if (!name.trim() || !email.trim() || password.length < 8) return;
    setSaving(true);
    try {
      const r = await getPocketBase().collection("users").create({
        name, email, password, passwordConfirm: password, role, department: dept,
      });
      toast.success(`Usuário ${name} criado!`);
      onCreated(r as unknown as User);
      onClose();
    } catch (e: unknown) {
      const msg = (e as { data?: { email?: { message?: string } } })?.data?.email?.message;
      toast.error(msg ?? "Erro ao criar usuário.");
    } finally { setSaving(false); }
  }

  return (
    <ModalShell title="Novo usuário" onClose={onClose}>
      <div className="space-y-3">
        <div><Label className="text-xs">Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9" autoFocus /></div>
        <div><Label className="text-xs">E-mail *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9" /></div>
        <div><Label className="text-xs">Senha * (mínimo 8 caracteres)</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-9" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Role</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as User["role"])}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Departamento</Label>
            <select value={dept} onChange={(e) => setDept(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
              <option value="">— Nenhum —</option>
              {depts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancelar</button>
        <button onClick={() => void handleCreate()}
          disabled={saving || !name.trim() || !email.trim() || password.length < 8}
          className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Criar usuário"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Dept Modal ─────────────────────────────────────────────────────────────────

function DeptModal({ initial, onSave, onClose }: {
  initial?: Dept;
  onSave: (d: Omit<Dept, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [desc, setDesc]         = useState(initial?.description ?? "");
  const [color, setColor]       = useState(initial?.color ?? DEPT_COLORS[0]);
  const [saving, setSaving]     = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try { await onSave({ name, description: desc, color }); onClose(); }
    catch { toast.error("Erro ao salvar departamento."); }
    finally { setSaving(false); }
  }

  return (
    <ModalShell title={initial ? "Editar departamento" : "Novo departamento"} onClose={onClose}>
      <div className="space-y-3">
        <div><Label className="text-xs">Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9" autoFocus /></div>
        <div><Label className="text-xs">Descrição</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1 h-9" placeholder="Ex: Tecnologia da Informação" /></div>
        <div>
          <Label className="text-xs mb-2 block">Cor identificadora</Label>
          <div className="flex gap-1.5 flex-wrap">
            {DEPT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={cn("w-7 h-7 rounded-full transition-transform", color === c && "scale-125 ring-2 ring-offset-1 ring-offset-card")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancelar</button>
        <button onClick={() => void handleSave()} disabled={saving || !name.trim()}
          className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Salvar"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = "usuarios" | "departamentos" | "roles";

export default function AdminPage() {
  const pathname = usePathname();
  const router   = useRouter();
  const pb       = getPocketBase();
  const myRole   = (pb.authStore.record as { role?: string })?.role;

  useEffect(() => {
    if (pb.authStore.isValid && myRole && myRole !== "admin") router.replace("/");
  }, [myRole, router, pb]);

  const [tab, setTab]             = useState<Tab>("usuarios");
  const [users, setUsers]         = useState<User[]>([]);
  const [depts, setDepts]         = useState<Dept[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState<string | null>(null);
  const [editDept, setEditDept]   = useState<Record<string, string>>({});
  const [showNewUser, setShowNewUser]     = useState(false);
  const [deptModal, setDeptModal]         = useState<Dept | null | "new">(null);

  useEffect(() => {
    if (myRole !== "admin") return;
    Promise.all([
      pb.collection("users").getFullList({ sort: "name" }),
      pb.collection("departments").getFullList({ sort: "name" }),
    ]).then(([userList, deptList]) => {
      const list = userList as unknown as User[];
      setUsers(list);
      const depts: Record<string, string> = {};
      list.forEach((u) => { depts[u.id] = u.department ?? ""; });
      setEditDept(depts);
      setDepts(deptList as unknown as Dept[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [myRole]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateRole(userId: string, role: string) {
    setSaving(userId + "-role");
    try {
      await pb.collection("users").update(userId, { role });
      setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: role as User["role"] } : u));
      toast.success("Role atualizada!");
    } catch { toast.error("Erro ao atualizar role."); }
    finally { setSaving(null); }
  }

  async function updateDept(userId: string) {
    const dept = editDept[userId] ?? "";
    setSaving(userId + "-dept");
    try {
      await pb.collection("users").update(userId, { department: dept });
      setUsers((p) => p.map((u) => u.id === userId ? { ...u, department: dept } : u));
      toast.success("Departamento salvo!");
    } catch { toast.error("Erro ao salvar departamento."); }
    finally { setSaving(null); }
  }

  async function saveDept(data: Omit<Dept, "id">, id?: string) {
    if (id) {
      const r = await pb.collection("departments").update(id, data);
      setDepts((p) => p.map((d) => d.id === id ? r as unknown as Dept : d));
      toast.success("Departamento atualizado!");
    } else {
      const r = await pb.collection("departments").create(data);
      setDepts((p) => [...p, r as unknown as Dept]);
      toast.success("Departamento criado!");
    }
  }

  async function deleteDept(id: string, name: string) {
    if (!confirm(`Excluir departamento "${name}"?`)) return;
    try {
      await pb.collection("departments").delete(id);
      setDepts((p) => p.filter((d) => d.id !== id));
      toast.success("Departamento removido.");
    } catch { toast.error("Erro ao remover."); }
  }

  if (!myRole || myRole !== "admin") return null;

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "usuarios",      label: "Usuários",      icon: Users    },
    { id: "departamentos", label: "Departamentos", icon: Building2 },
    { id: "roles",         label: "Roles",         icon: Shield   },
  ];

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Painel Admin
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerenciar usuários, departamentos e roles</p>
          </div>
          {tab === "usuarios" && (
            <button onClick={() => setShowNewUser(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Novo usuário
            </button>
          )}
          {tab === "departamentos" && (
            <button onClick={() => setDeptModal("new")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Novo departamento
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex items-center gap-2 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-colors",
                tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Icon style={{ width: 15, height: 15 }} /> {label}
            </button>
          ))}
        </div>

        {/* ── Usuários ── */}
        {tab === "usuarios" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou departamento..." className="pl-9 h-9" />
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
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
                        <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={u} size="sm" />
                              <span className="font-medium truncate max-w-[160px]">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">{u.email}</td>
                          <td className="px-4 py-3">
                            <select value={u.role} disabled={saving === u.id + "-role"}
                              onChange={(e) => updateRole(u.id, e.target.value)}
                              className={cn("w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs focus:outline-none", ROLE_BADGE[u.role])}>
                              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select value={editDept[u.id] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setEditDept((p) => ({ ...p, [u.id]: v }));
                                pb.collection("users").update(u.id, { department: v })
                                  .then(() => setUsers((p) => p.map((x) => x.id === u.id ? { ...x, department: v } : x)))
                                  .catch(() => toast.error("Erro ao salvar."));
                              }}
                              className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs focus:outline-none">
                              <option value="">— Nenhum —</option>
                              {depts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
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
          </>
        )}

        {/* ── Departamentos ── */}
        {tab === "departamentos" && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : depts.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">Nenhum departamento cadastrado.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {depts.map((d) => {
                  const memberCount = users.filter((u) => u.department === d.name).length;
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color ?? "#6b7280" }} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{d.name}</p>
                          {d.description && <p className="text-xs text-muted-foreground truncate">{d.description}</p>}
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {memberCount} membro{memberCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => setDeptModal(d)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                        <button onClick={() => deleteDept(d.id, d.name)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition-colors">
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Roles ── */}
        {tab === "roles" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Os 4 roles são fixos no sistema — cada um define um conjunto de permissões no backend e frontend.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROLE_INFO.map((r) => (
                <div key={r.role} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-bold px-2.5 py-1 rounded-lg", r.badge)}>{r.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {users.filter((u) => u.role === r.role).length} usuário(s)
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {r.perms.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
              Para criar roles personalizados com permissões customizadas, acesse o painel do PocketBase em{" "}
              <code className="text-primary">/pb/_/</code> e edite o campo <code className="text-primary">role</code> da coleção <code className="text-primary">users</code>.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewUser && (
          <NewUserModal depts={depts}
            onCreated={(u) => {
              setUsers((p) => [...p, u]);
              setEditDept((p) => ({ ...p, [u.id]: u.department ?? "" }));
            }}
            onClose={() => setShowNewUser(false)}
          />
        )}
        {deptModal && (
          <DeptModal
            initial={deptModal === "new" ? undefined : deptModal}
            onSave={(data) => saveDept(data, deptModal === "new" ? undefined : deptModal.id)}
            onClose={() => setDeptModal(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
