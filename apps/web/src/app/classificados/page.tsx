"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { useClassifieds } from "@/lib/hooks/useClassifieds";
import { useChannels } from "@/lib/hooks/useChannels";
import { pbFileUrl, formatDistanceToNow } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Plus, X, Loader2, MessageSquare, Tag } from "lucide-react";
import Image from "next/image";
import type { MarketplaceItem } from "@/types";
import { cn } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";

const STATUS_STYLE: Record<MarketplaceItem["status"], { label: string; class: string }> = {
  disponivel: { label: "Disponível", class: "bg-green-500/15 text-green-400 border-green-500/30" },
  reservado:  { label: "Reservado",  class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  vendido:    { label: "Vendido",    class: "bg-muted text-muted-foreground border-border" },
};

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "disponivel", label: "Disponíveis" },
  { value: "reservado", label: "Reservados" },
  { value: "vendido", label: "Vendidos" },
];

export default function ClassificadosPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [filter, setFilter] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const { items, loading, createItem } = useClassifieds(filter);
  const { createDM } = useChannels();
  const myId = getPocketBase().authStore.record?.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - photos.length);
    setPhotos((p) => [...p, ...arr]);
    arr.forEach((f) => {
      const r = new FileReader();
      r.onload = (e) => setPreviews((p) => [...p, e.target!.result as string]);
      r.readAsDataURL(f);
    });
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setFormLoading(true);
    try {
      await createItem({ title, description, price: Number(price) || 0, category, contact_via_dm: true, photos: photos.length ? photos : undefined });
      setTitle(""); setDescription(""); setPrice(""); setCategory(""); setPhotos([]); setPreviews([]);
      setShowForm(false);
    } finally { setFormLoading(false); }
  }

  async function handleContact(authorId: string) {
    const channelId = await createDM(authorId);
    router.push(`/chat/${channelId}`);
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Classificados</h1>
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Publicar item
          </Button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🛍️</p>
            <p className="font-medium">Nenhum item</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a publicar algo!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => {
              const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.disponivel;
              const mainPhoto = item.photos?.[0];
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="aspect-video bg-muted relative">
                    {mainPhoto ? (
                      <Image src={pbFileUrl("marketplace_items", item.id, mainPhoto, "600x340")} alt={item.title}
                        fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <span className={cn("absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full border font-medium", st.class)}>
                      {st.label}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                      {item.price > 0 && (
                        <span className="text-sm font-bold text-green-400 shrink-0">
                          R${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {item.expand?.author && <UserAvatar user={item.expand.author} size="sm" className="w-5 h-5" />}
                        <span>{item.expand?.author?.name}</span>
                        <span>· {formatDistanceToNow(item.created)}</span>
                      </div>
                      {item.author !== myId && item.status === "disponivel" && (
                        <button onClick={() => void handleContact(item.author)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" /> Contatar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Publicar item</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Título *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Cadeira executiva" className="mt-1 h-9" autoFocus />
                </div>
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Estado, motivo da venda..." className="mt-1 resize-none min-h-[60px]" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="mt-1 h-9" min={0} />
                  </div>
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Móveis, Tech" className="mt-1 h-9" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Fotos (até 5)</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {previews.map((src, i) => (
                      <div key={i} className="relative w-16 h-16">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => { setPhotos((p) => p.filter((_,j)=>j!==i)); setPreviews((p) => p.filter((_,j)=>j!==i)); }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px]">×</button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
                        <Plus className="w-5 h-5 text-muted-foreground" />
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-9">Cancelar</Button>
                <Button onClick={() => void handleSubmit()} disabled={!title.trim() || formLoading} className="flex-1 h-9">
                  {formLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Publicando...</> : "Publicar"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
