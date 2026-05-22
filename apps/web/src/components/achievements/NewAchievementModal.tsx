"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { User } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";

const ICONS = ["🏆","⭐","🎯","💡","❤️","🌟","🚀","🦁","💎","🔥","👏","🎉","✨","🎖️","🥇"];

interface Props {
  users: User[];
  onSubmit: (data: { title: string; description?: string; recipient: string; icon: string; date: string; public: boolean }) => Promise<void>;
  onClose: () => void;
}

export function NewAchievementModal({ users, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit() {
    if (!title.trim() || !recipientId) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, recipient: recipientId, icon, date, public: isPublic });
      onClose();
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Dar reconhecimento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          {/* Icon picker */}
          <div>
            <Label className="text-xs mb-2 block">Badge</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={`text-2xl p-1 rounded-lg transition-all hover:scale-110 ${icon === ic ? "bg-primary/20 scale-110 ring-2 ring-primary/50" : "hover:bg-muted"}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Funcionário do mês" className="mt-1 h-9" autoFocus />
          </div>
          <div>
            <Label className="text-xs">Mensagem</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Elogio personalizado..." className="mt-1 resize-none min-h-[60px]" rows={2} />
          </div>
          {/* Recipient */}
          <div>
            <Label className="text-xs">Para quem *</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="mt-1 h-9 mb-1" />
            <div className="max-h-36 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {filteredUsers.map((u) => (
                <button key={u.id} onClick={() => { setRecipientId(u.id); setSearch(u.name); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors text-sm hover:bg-muted ${recipientId === u.id ? "bg-primary/10" : ""}`}>
                  <UserAvatar user={u} size="sm" />
                  <div>
                    <p className="font-medium text-xs leading-none">{u.name}</p>
                    {u.department && <p className="text-[10px] text-muted-foreground mt-0.5">{u.department}</p>}
                  </div>
                  {recipientId === u.id && <span className="ml-auto text-primary text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-9" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="public" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            <label htmlFor="public" className="text-sm">Publicar no mural de conquistas</label>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !recipientId || loading} className="flex-1 h-9">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Enviando...</> : "Dar reconhecimento 🏆"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
