"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../layout-dashboard";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { UserAvatar } from "@/components/shared/UserAvatar";
import getPocketBase from "@/lib/pocketbase";
import { ArrowLeft, Loader2, Pencil, Trash2, Check, X, Paperclip, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WikiArticle } from "@/types";

const CAT_COLORS: Record<string, string> = {
  "FAQ":      "bg-blue-500/15 text-blue-400",
  "Tutorial": "bg-emerald-500/15 text-emerald-400",
  "Processo": "bg-purple-500/15 text-purple-400",
  "Política": "bg-amber-500/15 text-amber-400",
  "Outros":   "bg-muted text-muted-foreground",
};

export default function WikiArticlePage() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canManage = myRole === "admin" || myRole === "rh";

  useEffect(() => {
    if (!id) return;
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("wiki_articles").getOne(id, { expand: "author" })
      .then((r) => {
        const a = r as unknown as WikiArticle;
        setArticle(a);
        setEditTitle(a.title);
        setEditContent(a.content);
        setEditTags(a.tags ?? "");
      })
      .catch(() => router.push("/wiki"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSave() {
    if (!article || !editTitle.trim()) return;
    setSaving(true);
    try {
      await getPocketBase().collection("wiki_articles").update(article.id, {
        title: editTitle.trim(), content: editContent, tags: editTags.trim(),
      });
      setArticle({ ...article, title: editTitle.trim(), content: editContent, tags: editTags.trim() });
      setEditing(false);
      toast.success("Artigo atualizado.");
    } catch { toast.error("Erro ao salvar."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!article || !confirm("Excluir este artigo?")) return;
    try {
      await getPocketBase().collection("wiki_articles").delete(article.id);
      toast.success("Artigo removido.");
      router.push("/wiki");
    } catch { toast.error("Erro ao remover."); }
  }

  if (loading) {
    return (
      <DashboardLayout pathname={pathname}>
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  if (!article) return null;

  const author = article.expand?.author;
  const catCls = CAT_COLORS[article.category] ?? CAT_COLORS["Outros"];
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content);
  const updatedDate = new Date(article.updated).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6">
        <button onClick={() => router.push("/wiki")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para Wiki
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", catCls)}>{article.category}</span>
                  {article.tags?.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{t}</span>
                  ))}
                </div>
                {!editing && <h1 className="text-2xl font-bold leading-tight">{article.title}</h1>}
              </div>
              {canManage && !editing && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditing(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => void handleDelete()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition-colors">
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Título</Label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
                </div>
                <div>
                  <Label className="text-xs">Conteúdo</Label>
                  <RichTextEditor value={editContent} onChange={setEditContent} placeholder="Escreva o conteúdo..." className="mt-1" minHeight={200} />
                </div>
                <div>
                  <Label className="text-xs">Tags (vírgula)</Label>
                  <input value={editTags} onChange={(e) => setEditTags(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void handleSave()} disabled={saving || !editTitle.trim()} className="gap-1.5">
                    <Check className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {isHtml
                  ? <RichTextContent html={article.content} className="text-base leading-relaxed" />
                  : <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{article.content}</p>
                }
              </div>
            )}

            {/* Footer */}
            {!editing && author && (
              <div className="border-t border-border/50 pt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserAvatar user={author} size="sm" />
                  <div>
                    <p className="text-xs text-muted-foreground">Última atualização por</p>
                    <p className="text-sm font-medium">{author.name}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{updatedDate}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
