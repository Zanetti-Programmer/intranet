"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Eye, EyeOff } from "lucide-react";
import { pbFileUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

function fileExt(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function FileIcon({ filename }: { filename: string }) {
  const ext = fileExt(filename);
  if (ext === "pdf")
    return <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400 font-bold text-xs">PDF</div>;
  if (["doc", "docx"].includes(ext))
    return <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 font-bold text-xs">DOC</div>;
  if (["xls", "xlsx"].includes(ext))
    return <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs">XLS</div>;
  if (["ppt", "pptx"].includes(ext))
    return <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 font-bold text-xs">PPT</div>;
  return <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs">{ext.toUpperCase() || "?"}</div>;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Políticas":     "bg-purple-500/15 text-purple-400",
  "Procedimentos": "bg-blue-500/15 text-blue-400",
  "Formulários":   "bg-emerald-500/15 text-emerald-400",
  "Comunicados":   "bg-amber-500/15 text-amber-400",
  "Outros":        "bg-muted text-muted-foreground",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `${d}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface Props {
  document: Document;
  index: number;
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

export function DocumentCard({ document: doc, index }: Props) {
  const url = pbFileUrl("documents", doc.id, doc.file);
  const catCls = CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS["Outros"];
  const ext = doc.file.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";
  const isImage = IMAGE_EXTS.has(ext);
  const previewable = isPdf || isImage;
  const [preview, setPreview] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-border/60 transition-colors"
    >
      <div className="flex items-start gap-3">
        <FileIcon filename={doc.file} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug line-clamp-2">{doc.title}</p>
          {doc.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>
          )}
        </div>
      </div>

      {preview && isPdf && (
        <iframe src={url} title={doc.title}
          className="w-full h-64 rounded-lg border border-border bg-muted" />
      )}
      {preview && isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={doc.title}
          className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted" />
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", catCls)}>
            {doc.category}
          </span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(doc.created)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {previewable && (
            <button onClick={() => setPreview((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
              {preview
                ? <><EyeOff style={{ width: 13, height: 13 }} /> Fechar</>
                : <><Eye style={{ width: 13, height: 13 }} /> Visualizar</>}
            </button>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
            <Download style={{ width: 13, height: 13 }} />
            Download
          </a>
        </div>
      </div>
    </motion.div>
  );
}
