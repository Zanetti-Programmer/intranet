"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../../layout-dashboard";
import { useChannels } from "@/lib/hooks/useChannels";
import { pbFileUrl, formatDistanceToNow } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ArrowLeft, MessageSquare, Tag, Loader2, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import Image from "next/image";
import type { MarketplaceItem } from "@/types";
import { cn } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";
import { toast } from "sonner";

const STATUS_STYLE: Record<MarketplaceItem["status"], { label: string; class: string }> = {
  disponivel: { label: "Disponível", class: "bg-green-500/15 text-green-400 border-green-500/30" },
  reservado:  { label: "Reservado",  class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  vendido:    { label: "Vendido",    class: "bg-muted text-muted-foreground border-border" },
};

const STATUS_OPTIONS: { value: MarketplaceItem["status"]; label: string }[] = [
  { value: "disponivel", label: "Disponível" },
  { value: "reservado",  label: "Reservado" },
  { value: "vendido",    label: "Vendido" },
];

export default function ClassificadoDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCondition, setEditCondition] = useState<"novo" | "usado" | "">("");
  const [editLoading, setEditLoading] = useState(false);

  const { createDM } = useChannels();
  const myId = getPocketBase().authStore.record?.id;

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("marketplace_items")
      .getOne(id, { expand: "author" })
      .then((r) => setItem(r as unknown as MarketplaceItem))
      .catch(() => router.replace("/classificados"))
      .finally(() => setLoading(false));

    pb.collection("marketplace_items").subscribe(id, (e) => {
      if (e.action === "update") setItem((prev) => prev ? { ...prev, ...e.record } as MarketplaceItem : prev);
      if (e.action === "delete") router.replace("/classificados");
    }).catch(() => {});

    return () => { pb.collection("marketplace_items").unsubscribe(id).catch(() => {}); };
  }, [id, router]);

  function openEdit() {
    if (!item) return;
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditPrice(item.price > 0 ? String(item.price) : "");
    setEditCategory(item.category ?? "");
    setEditCondition((item.condition ?? "") as "novo" | "usado" | "");
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    if (!item || !editTitle.trim()) return;
    setEditLoading(true);
    try {
      const updated = await getPocketBase().collection("marketplace_items").update(item.id, {
        title: editTitle.trim(),
        description: editDescription,
        price: Number(editPrice) || 0,
        category: editCategory,
        condition: editCondition || null,
      }, { expand: "author" });
      setItem((prev) => prev ? { ...prev, ...updated } as MarketplaceItem : prev);
      toast.success("Anúncio atualizado.");
      setShowEdit(false);
    } catch {
      toast.error("Erro ao atualizar anúncio.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleContact() {
    if (!item) return;
    const channelId = await createDM(item.author);
    router.push(`/chat/${channelId}`);
  }

  async function handleStatusChange(status: MarketplaceItem["status"]) {
    if (!item) return;
    setStatusLoading(true);
    try {
      await getPocketBase().collection("marketplace_items").update(item.id, { status });
      setItem((prev) => prev ? { ...prev, status } : prev);
      toast.success("Status atualizado.");
    } catch {
      toast.error("Erro ao atualizar status.");
    } finally {
      setStatusLoading(false);
    }
  }

  const isOwn = item?.author === myId;
  const images = item?.photos ?? [];
  const st = item ? (STATUS_STYLE[item.status] ?? STATUS_STYLE.disponivel) : STATUS_STYLE.disponivel;

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar aos classificados
        </button>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : item ? (
          <div className="space-y-5">
            {/* Photo gallery */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {images.length > 0 ? (
                <div className="relative aspect-video bg-muted">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={photoIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={pbFileUrl("marketplace_items", item.id, images[photoIndex], "800x450")}
                        alt={item.title} fill className="object-cover" unoptimized
                      />
                    </motion.div>
                  </AnimatePresence>
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIndex((p) => (p - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPhotoIndex((p) => (p + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPhotoIndex(i)}
                            className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === photoIndex ? "bg-white" : "bg-white/40")}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Tag className="w-16 h-16 text-muted-foreground/20" />
                </div>
              )}

              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img}
                      onClick={() => setPhotoIndex(i)}
                      className={cn(
                        "relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors",
                        i === photoIndex ? "border-primary" : "border-transparent"
                      )}
                    >
                      <Image src={pbFileUrl("marketplace_items", item.id, img, "120x120")} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold leading-snug">{item.title}</h1>
                  {item.category && (
                    <span className="text-xs text-muted-foreground mt-0.5 block">{item.category}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {item.price > 0 && (
                    <span className="text-xl font-bold text-green-400">
                      R${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", st.class)}>
                      {st.label}
                    </span>
                    {item.condition && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium bg-muted text-muted-foreground border-border">
                        {item.condition === "novo" ? "Novo" : "Usado"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
              )}

              <div className="border-t border-border/60 pt-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {item.expand?.author && <UserAvatar user={item.expand.author} size="md" />}
                  <div>
                    <p className="text-sm font-medium">{item.expand?.author?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(item.created)}</p>
                  </div>
                </div>

                {!isOwn && item.status === "disponivel" && (
                  <Button onClick={() => void handleContact()} className="gap-1.5">
                    <MessageSquare className="w-4 h-4" /> Contatar vendedor
                  </Button>
                )}
              </div>
            </div>

            {/* Owner controls */}
            {isOwn && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gerenciar anúncio</p>
                  <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 h-8 text-xs">
                    <Pencil className="w-3.5 h-3.5" /> Editar anúncio
                  </Button>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        disabled={statusLoading || item.status === opt.value}
                        onClick={() => void handleStatusChange(opt.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50",
                          item.status === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
                        )}
                      >
                        {statusLoading && item.status !== opt.value ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEdit(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Editar anúncio</h3>
                <button onClick={() => setShowEdit(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Título *</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 h-9" autoFocus />
                </div>
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1 resize-none min-h-[80px]" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="0,00" className="mt-1 h-9" min={0} />
                  </div>
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="mt-1 h-9" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Condição</Label>
                  <div className="flex gap-2">
                    {(["novo", "usado"] as const).map((c) => (
                      <button key={c} type="button" onClick={() => setEditCondition(editCondition === c ? "" : c)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          editCondition === c ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:text-foreground")}>
                        {c === "novo" ? "Novo" : "Usado"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 h-9">Cancelar</Button>
                <Button onClick={() => void handleSaveEdit()} disabled={!editTitle.trim() || editLoading} className="flex-1 h-9">
                  {editLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Salvando...</> : "Salvar"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
