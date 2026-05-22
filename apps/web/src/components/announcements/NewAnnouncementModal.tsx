"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Geral", "RH", "TI", "Comercial", "Outros"];
const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "high",   label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

interface Props {
  onSubmit: (data: {
    title: string;
    body: string;
    category: string;
    priority: string;
    pinned: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function NewAnnouncementModal({ onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Geral");
  const [priority, setPriority] = useState("normal");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title, body, category, priority, pinned });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const selectCls = "mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Novo Aviso</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de equipe quinta-feira"
              className="mt-1 h-9"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs">Mensagem *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Descreva o aviso em detalhes..."
              className="mt-1 resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Categoria</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="pinned" className="text-sm cursor-pointer">
              📌 Fixar no topo dos avisos
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || loading}
            className="flex-1 h-9"
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Publicando...</>
              : "Publicar aviso 📢"
            }
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
