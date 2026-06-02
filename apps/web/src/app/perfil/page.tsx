"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, KeyRound, FileText, Trophy, Users } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@/types";

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "Admin",   cls: "bg-purple-500/15 text-purple-400" },
  rh:    { label: "RH",      cls: "bg-pink-500/15 text-pink-400" },
  ti:    { label: "TI",      cls: "bg-blue-500/15 text-blue-400" },
  user:  { label: "Usuário", cls: "bg-muted text-muted-foreground" },
};

export default function PerfilPage() {
  const pathname = usePathname();
  const pb = getPocketBase();
  const record = pb.authStore.record as (User & { id: string }) | null;

  const [name, setName]           = useState(record?.name ?? "");
  const [bio, setBio]             = useState(record?.bio ?? "");
  const [department, setDepartment] = useState(record?.department ?? "");
  const [phone, setPhone]         = useState(record?.phone ?? "");
  const [birthday, setBirthday]   = useState(record?.birthday?.slice(0, 10) ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [depts, setDepts] = useState<string[]>([]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [stats, setStats] = useState({ posts: 0, achievements: 0, connections: 0 });

  useEffect(() => {
    pb.collection("departments").getFullList({ sort: "name" })
      .then((r) => setDepts(r.map((d) => d.name as string)))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!record?.id) return;
    const id = record.id;
    Promise.all([
      pb.collection("posts").getList(1, 1, { filter: `author = "${id}"` }).catch(() => ({ totalItems: 0 })),
      pb.collection("achievements").getList(1, 1, { filter: `recipient = "${id}"` }).catch(() => ({ totalItems: 0 })),
      pb.collection("users").getList(1, 1, {}).catch(() => ({ totalItems: 0 })),
    ]).then(([posts, ach, users]) => {
      setStats({
        posts: posts.totalItems,
        achievements: ach.totalItems,
        connections: Math.max(0, users.totalItems - 1),
      });
    });
  }, [record?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveProfile() {
    if (!record?.id) return;
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("bio", bio.trim());
      formData.append("department", department.trim());
      formData.append("phone", phone.trim());
      formData.append("birthday", birthday || "");
      if (avatarFile) formData.append("avatar", avatarFile);

      const updated = await pb.collection("users").update(record.id, formData);
      await pb.collection("users").authRefresh().catch(() => {});
      pb.authStore.save(pb.authStore.token, updated);
      toast.success("Perfil atualizado com sucesso!");
      setAvatarFile(null);
    } catch {
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSavingPassword(true);
    try {
      await pb.collection("users").update(record!.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      });
      toast.success("Senha alterada com sucesso!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Senha atual incorreta ou erro ao alterar.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (!record) return null;

  const roleBadge = ROLE_BADGE[record.role] ?? ROLE_BADGE.user;

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5"
        >
          <AvatarUpload user={record} onFileSelect={setAvatarFile} />
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h1 className="text-xl font-semibold">{record.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", roleBadge.cls)}>
                {roleBadge.label}
              </span>
              {record.department && (
                <span className="text-xs text-muted-foreground">{record.department}</span>
              )}
            </div>
            {record.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">{record.bio}</p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: FileText, label: "Posts", value: stats.posts },
            { icon: Users,    label: "Colegas", value: stats.connections },
            { icon: Trophy,   label: "Conquistas", value: stats.achievements },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Edit profile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <h2 className="font-semibold text-sm">Editar Perfil</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">Departamento</Label>
              {depts.length > 0 ? (
                <select value={department} onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">— Nenhum —</option>
                  {depts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 h-9" placeholder="Ex: Marketing" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-9" placeholder="(11) 9 0000-0000" />
            </div>
            <div>
              <Label className="text-xs">Data de nascimento</Label>
              <Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="mt-1 h-9" />
              <p className="text-[10px] text-muted-foreground mt-1">Usada na página de aniversariantes</p>
            </div>
          </div>

          <div>
            <Label className="text-xs">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Uma frase sobre você..."
              className="mt-1 resize-none"
              rows={2}
            />
          </div>

          {avatarFile && (
            <p className="text-xs text-primary">📎 Nova foto selecionada — será salva ao clicar em Salvar.</p>
          )}

          <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm" className="gap-1.5">
            {savingProfile
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando...</>
              : <><Save className="w-3.5 h-3.5" />Salvar alterações</>
            }
          </Button>
        </motion.div>

        {/* Change password */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            Alterar Senha
          </h2>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Senha atual</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1 h-9"
                autoComplete="current-password"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nova senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 h-9"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label className="text-xs">Confirmar senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 h-9"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !oldPassword || !newPassword || !confirmPassword}
            size="sm"
            variant="outline"
            className="gap-1.5"
          >
            {savingPassword
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Alterando...</>
              : <><KeyRound className="w-3.5 h-3.5" />Alterar senha</>
            }
          </Button>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
