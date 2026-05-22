"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Users, X, Trash2, ArrowRight } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Space } from "@/types";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

const PRESET_ICONS = ["💼", "🛠️", "📊", "🎯", "💡", "🤝", "🚀", "🎨", "📱", "🔬", "📋", "🏆"];

function SpaceCard({ space, isAdmin, onDelete, index }: {
  space: Space; isAdmin: boolean; onDelete: (id: string) => void; index: number;
}) {
  const router = useRouter();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-border/60 transition-colors group relative">
      <div className="h-2" style={{ backgroundColor: space.color }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{space.icon}</span>
            <h3 className="font-semibold text-sm">{space.name}</h3>
          </div>
          {isAdmin && (
            <button onClick={() => onDelete(space.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>
        {space.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{space.description}</p>
        )}
        <button onClick={() => router.push(`/?space=${space.id}`)}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
          Ver feed <ArrowRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </motion.div>
  );
}

function NewSpaceModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name, description, color, icon });
      onClose();
    } catch { toast.error("Erro ao criar grupo."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Novo grupo</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div><Label className="text-xs">Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9" autoFocus placeholder="ex: Time de TI" />
        </div>
        <div><Label className="text-xs">Descrição</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 h-9" placeholder="Sobre este grupo..." />
        </div>
        <div>
          <Label className="text-xs">Ícone</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PRESET_ICONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)}
                className={cn("w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors",
                  icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Cor</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={cn("w-7 h-7 rounded-full border-2 transition-all",
                  color === c ? "border-foreground scale-110" : "border-transparent")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!name.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar grupo"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function GruposPage() {
  const pathname = usePathname();
  const { spaces, loading, createSpace, deleteSpace } = useSpaces();
  const [showModal, setShowModal] = useState(false);

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const isAdmin = myRole === "admin";

  async function handleDelete(id: string) {
    if (!confirm("Excluir este grupo?")) return;
    try { await deleteSpace(id); toast.success("Grupo removido."); }
    catch { toast.error("Erro ao remover grupo."); }
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />Grupos & Espaços
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Times e departamentos com feed próprio</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" />Novo grupo
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">👥</p>
            <p className="font-medium">Nenhum grupo criado ainda</p>
            {isAdmin && <p className="text-sm text-muted-foreground">Crie o primeiro grupo da empresa.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map((space, i) => (
              <SpaceCard key={space.id} space={space} index={i} isAdmin={isAdmin} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && <NewSpaceModal onSubmit={createSpace} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
