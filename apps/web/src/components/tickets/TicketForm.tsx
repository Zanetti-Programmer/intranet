"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  onSubmit: (data: { title: string; description: string; category: string; priority: string }) => Promise<void>;
  onClose: () => void;
}

export function TicketForm({ onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("software");
  const [priority, setPriority] = useState("media");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, category, priority });
      onClose();
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Novo chamado</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Descreva o problema resumidamente" className="mt-1 h-9" autoFocus />
          </div>
          <div>
            <Label className="text-xs">Descrição *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o problema com detalhes..." className="mt-1 resize-none min-h-[80px]" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Categoria</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-9 bg-background border border-input rounded-md text-sm px-2">
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="rede">Rede</option>
                <option value="acesso">Acesso / Senha</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full h-9 bg-background border border-input rounded-md text-sm px-2">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !description.trim() || loading} className="flex-1 h-9">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Abrindo...</> : "Abrir chamado"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
