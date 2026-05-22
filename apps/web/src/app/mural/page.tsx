"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useMural } from "@/lib/hooks/useMural";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, LayoutGrid, X, Trash2 } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { WallCard, User } from "@/types";

const CARD_TYPES = [
  { value: "parabens",    label: "Parabéns",    emoji: "🎉", bg: "bg-amber-500/10 border-amber-500/30",   text: "text-amber-400" },
  { value: "boas_vindas", label: "Boas-vindas", emoji: "👋", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
  { value: "conquista",   label: "Conquista",   emoji: "🏆", bg: "bg-violet-500/10 border-violet-500/30",  text: "text-violet-400" },
  { value: "despedida",   label: "Despedida",   emoji: "💙", bg: "bg-blue-500/10 border-blue-500/30",      text: "text-blue-400" },
  { value: "recado",      label: "Recado",      emoji: "📝", bg: "bg-muted border-border",                 text: "text-muted-foreground" },
] as const;

function typeStyle(type: string) {
  return CARD_TYPES.find((t) => t.value === type) ?? CARD_TYPES[4];
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function WallCardItem({ card, canDelete, onDelete, index }: {
  card: WallCard; canDelete: boolean; onDelete: (id: string) => void; index: number;
}) {
  const style = typeStyle(card.type);
  const author = card.expand?.author;
  const recipient = card.expand?.recipient;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className={cn("border rounded-2xl p-4 space-y-3 relative group", style.bg)}>
      {canDelete && (
        <button onClick={() => onDelete(card.id)}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xl">{card.emoji}</span>
        <span className={cn("text-xs font-medium", style.text)}>{typeStyle(card.type).label}</span>
        {recipient && (
          <>
            <span className="text-xs text-muted-foreground">para</span>
            <span className="text-xs font-medium">{recipient.name}</span>
          </>
        )}
      </div>
      <p className="text-sm leading-relaxed">{card.message}</p>
      {author && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/30">
          <UserAvatar user={author} size="sm" />
          <span className="text-xs text-muted-foreground">{author.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(card.created)}</span>
        </div>
      )}
    </motion.div>
  );
}

function NewCardModal({ onSubmit, onClose }: { onSubmit: (d: any) => Promise<void>; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<string>("parabens");
  const [emoji, setEmoji] = useState("🎉");
  const [recipientId, setRecipientId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPocketBase().collection("users").getFullList({ sort: "name" })
      .then((u) => setUsers(u as unknown as User[])).catch(() => {});
  }, []);

  function handleTypeChange(v: string) {
    setType(v);
    setEmoji(typeStyle(v).emoji);
  }

  async function submit() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ message, type, emoji, recipient: recipientId || undefined });
      onClose();
    } catch { toast.error("Erro ao publicar."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nova mensagem no Mural</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div>
          <Label className="text-xs">Tipo</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {CARD_TYPES.map((t) => (
              <button key={t.value} onClick={() => handleTypeChange(t.value)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  type === t.value ? cn(t.bg, t.text) : "border-border text-muted-foreground hover:border-primary/50")}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Emoji</Label>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
            className="mt-1 w-16 h-9 text-center text-xl border border-input bg-transparent rounded-md focus:outline-none" maxLength={2} />
        </div>

        <div>
          <Label className="text-xs">Destinatário (opcional)</Label>
          <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}
            className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none">
            <option value="">— Geral (todos) —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <Label className="text-xs">Mensagem *</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva sua mensagem..." className="mt-1 resize-none min-h-[100px]" rows={4} autoFocus />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={submit} disabled={!message.trim() || loading} className="flex-1 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MuralPage() {
  const pathname = usePathname();
  const { cards, loading, createCard, deleteCard } = useMural();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");

  const myId = getPocketBase().authStore.record?.id;
  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const isAdmin = myRole === "admin" || myRole === "rh";

  const filtered = useMemo(() =>
    filter === "all" ? cards : cards.filter((c) => c.type === filter),
  [cards, filter]);

  async function handleDelete(id: string) {
    try { await deleteCard(id); toast.success("Removido."); }
    catch { toast.error("Erro ao remover."); }
  }

  async function handleCreate(data: any) {
    await createCard(data);
    toast.success("Mensagem publicada!");
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />Mural
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Parabéns, recados e homenagens entre colegas</p>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />Nova mensagem
          </Button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[["all", "Todos"], ...CARD_TYPES.map((t) => [t.value, t.label])].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v as string)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🖼️</p>
            <p className="font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a publicar algo no mural!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((card, i) => (
              <div key={card.id} className="break-inside-avoid mb-4">
                <WallCardItem card={card} index={i}
                  canDelete={isAdmin || card.author === myId}
                  onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && <NewCardModal onSubmit={handleCreate} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
