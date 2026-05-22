"use client";
import { useRef, useState, KeyboardEvent } from "react";
import { Paperclip, Send, X, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_EMOJIS = ["😄", "👍", "❤️", "🎉", "🔥", "😮", "🤔", "👏"];

interface Props {
  onSend: (content: string, files?: File[]) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, onTyping, onStopTyping, disabled, placeholder }: Props) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ name: string; isImage: boolean; url?: string }[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(picked: FileList | null) {
    if (!picked) return;
    const arr = Array.from(picked).slice(0, 5);
    setFiles((prev) => [...prev, ...arr].slice(0, 5));
    arr.forEach((f) => {
      const isImage = f.type.startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) =>
          setPreviews((prev) => [...prev, { name: f.name, isImage: true, url: e.target!.result as string }]);
        reader.readAsDataURL(f);
      } else {
        setPreviews((prev) => [...prev, { name: f.name, isImage: false }]);
      }
    });
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, j) => j !== i));
    setPreviews((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleSend() {
    if ((!content.trim() && !files.length) || sending) return;
    setSending(true);
    try {
      await onSend(content, files.length ? files : undefined);
      setContent("");
      setFiles([]);
      setPreviews([]);
      onStopTyping();
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(v: string) {
    setContent(v);
    if (v.trim()) onTyping();
    else onStopTyping();
  }

  const canSend = (content.trim().length > 0 || files.length > 0) && !disabled;

  return (
    <div className="px-4 pb-4 shrink-0">
      {/* File previews */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 flex-wrap mb-2 p-2 bg-muted/50 rounded-xl">
            {previews.map((p, i) => (
              <div key={i} className="relative group">
                {p.isImage && p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={p.name} className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center text-xs text-center p-1 text-muted-foreground">
                    📎<br />{p.name.slice(0, 8)}
                  </div>
                )}
                <button onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                  ×
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className={cn("flex items-end gap-2 bg-muted rounded-2xl px-3 py-2 border border-border focus-within:border-primary/40 transition-colors",
        disabled && "opacity-50")}>

        {/* Attachment */}
        <button onClick={() => fileRef.current?.click()} disabled={disabled}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0 mb-0.5">
          <Paperclip className="w-4 h-4" />
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden" onChange={(e) => addFiles(e.target.files)} />

        {/* Text */}
        <Textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder ?? "Mensagem..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-0 min-h-0 max-h-32 py-1"
        />

        {/* Emoji */}
        <div className="relative shrink-0 mb-0.5">
          <button onClick={() => setShowEmoji((v) => !v)} disabled={disabled}
            className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <Smile className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showEmoji && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-xl p-2 shadow-xl z-20 flex gap-1">
                {QUICK_EMOJIS.map((em) => (
                  <button key={em} onClick={() => { setContent((v) => v + em); setShowEmoji(false); }}
                    className="text-lg hover:scale-125 transition-transform p-0.5">
                    {em}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Send */}
        <Button size="icon" onClick={handleSend} disabled={!canSend}
          className={cn("w-8 h-8 rounded-xl shrink-0 transition-all",
            canSend ? "opacity-100" : "opacity-40 cursor-not-allowed")}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-1">Enter para enviar · Shift+Enter para nova linha</p>
    </div>
  );
}
