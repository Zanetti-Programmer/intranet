"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Políticas", "Procedimentos", "Formulários", "Comunicados", "Outros"];

interface Props {
  onSubmit: (data: { title: string; description: string; category: string; file: File }) => Promise<void>;
  onClose: () => void;
}

export function UploadDocumentModal({ onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Políticas");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!title.trim() || !file) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, category, file });
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
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Upload de Documento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Política de Férias 2025" className="mt-1 h-9" autoFocus />
          </div>

          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do documento..." className="mt-1 resize-none" rows={2} />
          </div>

          <div>
            <Label className="text-xs">Categoria</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-xs">Arquivo *</Label>
            <div
              onClick={() => inputRef.current?.click()}
              className="mt-1 border border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground" />
              {file ? (
                <p className="text-sm font-medium text-primary">{file.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Clique para selecionar (PDF, DOCX, XLS…)</p>
              )}
            </div>
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !file || loading} className="flex-1 h-9">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Enviando...</> : "Publicar documento 📄"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
