"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Space } from "@/types";
import { Image as ImageIcon, X, Loader2, ChevronDown } from "lucide-react";
import NextImage from "next/image";
import { cn, compressImage } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  spaces: Space[];
  onSubmit: (content: string, spaceId?: string, files?: File[]) => Promise<void>;
  defaultSpaceId?: string;
}

export function PostComposer({ spaces, onSubmit, defaultSpaceId }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [spaceId, setSpaceId] = useState(defaultSpaceId ?? "");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedSpace = spaces.find((s) => s.id === spaceId);

  async function handleFiles(picked: FileList | null) {
    if (!picked) return;
    const arr = Array.from(picked).slice(0, 4);
    const compressed = await Promise.all(arr.map((f) => compressImage(f, 20)));
    setFiles((prev) => [...prev, ...compressed].slice(0, 4));
    compressed.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target!.result as string].slice(0, 4));
      reader.readAsDataURL(f);
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onSubmit(content.trim(), spaceId || undefined, files.length ? files : undefined);
      setContent("");
      setFiles([]);
      setPreviews([]);
      setExpanded(false);
    } catch (err) {
      console.error("[PostComposer] createPost failed:", err);
      toast.error("Erro ao publicar.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <UserAvatar user={user} size="md" className="shrink-0 mt-0.5" />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="O que está acontecendo?"
          className={cn(
            "resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-0 placeholder:text-muted-foreground/60 transition-all",
            expanded ? "min-h-[80px]" : "min-h-[36px]"
          )}
        />
      </div>

      {/* Previews */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`grid gap-1.5 ${previews.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <NextImage src={src} alt="" fill className="object-cover" unoptimized />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-2 pt-2 border-t border-border"
          >
            <div className="flex items-center gap-2">
              {/* Upload */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

              {/* Space selector */}
              <div className="relative">
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="appearance-none bg-muted text-xs px-2.5 py-1 pr-6 rounded-lg border-0 text-muted-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>

              {selectedSpace && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${selectedSpace.color}20`, color: selectedSpace.color }}>
                  {selectedSpace.icon} {selectedSpace.name}
                </span>
              )}
            </div>

            <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || loading} className="h-8 px-4">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
