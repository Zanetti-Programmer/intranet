"use client";
export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { InstagramWidget } from "@/components/gallery/InstagramWidget";
import { useGallery, useAlbumPhotos } from "@/lib/hooks/useGallery";
import { pbFileUrl, formatDistanceToNow, compressImage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GridSkeleton } from "@/components/ui/skeleton";
import { Plus, Upload, ArrowLeft, Loader2, Image as ImageIcon, X, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function GaleriaPage() {
  const pathname = usePathname();
  const { albums, loading: albumsLoading, createAlbum, deleteAlbum } = useGallery();
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const { photos, loading: photosLoading, hasMore: photosHasMore, loadMore: photosLoadMore, uploadPhotos } = useAlbumPhotos(activeAlbum);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumEvent, setNewAlbumEvent] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleCreateAlbum() {
    if (!newAlbumName.trim()) return;
    const id = await createAlbum(newAlbumName.trim(), newAlbumEvent.trim() || undefined);
    setNewAlbumName(""); setNewAlbumEvent(""); setShowNewAlbum(false);
    setActiveAlbum(id);
  }

  async function handleUpload(files: FileList | File[]) {
    if (!activeAlbum || !files.length) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) { toast.error("Selecione apenas imagens (JPG, PNG, GIF, WebP)."); return; }
    setUploadProgress({ current: 0, total: imageFiles.length });
    try {
      const compressed = await Promise.all(imageFiles.map((f) => compressImage(f, 30)));
      await uploadPhotos(activeAlbum, compressed, (current, total) => setUploadProgress({ current, total }));
      toast.success(`${imageFiles.length} foto${imageFiles.length > 1 ? "s" : ""} enviada${imageFiles.length > 1 ? "s" : ""}!`);
    } catch {
      toast.error("Erro ao enviar fotos. Verifique o formato (JPG, PNG, GIF, WebP).");
    } finally { setUploadProgress(null); }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const imageFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length) void handleUpload(imageFiles);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAlbum]);

  const activeAlbumData = albums.find((a) => a.id === activeAlbum);

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeAlbum && (
              <button onClick={() => setActiveAlbum(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold">{activeAlbumData?.name ?? "Galeria"}</h1>
              {activeAlbumData?.event_name && <p className="text-xs text-muted-foreground">{activeAlbumData.event_name}</p>}
            </div>
          </div>
          {!activeAlbum ? (
            <Button onClick={() => setShowNewAlbum(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Novo álbum
            </Button>
          ) : (
            <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${uploadProgress ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
              {uploadProgress
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress.current}/{uploadProgress.total}</>
                : <><Upload className="w-3.5 h-3.5" /> Adicionar fotos</>}
              <input type="file" accept="image/*" multiple className="hidden" disabled={!!uploadProgress}
                onChange={(e) => { if (e.target.files) void handleUpload(e.target.files); }} />
            </label>
          )}
        </div>

        <AnimatePresence>
          {showNewAlbum && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="bg-card border border-border rounded-xl p-4 flex gap-2">
                <input value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Nome do álbum *" className="flex-1 h-9 bg-background border border-input rounded-lg px-3 text-sm" autoFocus />
                <input value={newAlbumEvent} onChange={(e) => setNewAlbumEvent(e.target.value)}
                  placeholder="Evento (opcional)" className="flex-1 h-9 bg-background border border-input rounded-lg px-3 text-sm" />
                <Button onClick={() => void handleCreateAlbum()} disabled={!newAlbumName.trim()} size="sm" className="h-9">Criar</Button>
                <button onClick={() => setShowNewAlbum(false)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!activeAlbum ? (
          <>
            {albumsLoading ? (
              <GridSkeleton cols={4} count={8} />
            ) : albums.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-4xl">📷</p>
                <p className="font-medium">Nenhum álbum ainda</p>
                <p className="text-sm text-muted-foreground">Crie um álbum para compartilhar fotos de eventos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {albums.map((album, i) => (
                  <motion.div key={album.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="group relative text-left bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                    <button onClick={() => setActiveAlbum(album.id)} className="w-full text-left">
                      <div className="aspect-square bg-muted relative">
                        {album.cover ? (
                          <Image src={pbFileUrl("gallery_albums", album.id, album.cover, "400x400")} alt={album.name}
                            fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate">{album.name}</p>
                        {album.event_name && <p className="text-xs text-muted-foreground truncate">{album.event_name}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(album.created)}</p>
                      </div>
                    </button>
                    <button
                      onClick={async (e) => { e.stopPropagation(); if (!confirm(`Excluir álbum "${album.name}" e todas as fotos?`)) return; try { await deleteAlbum(album.id); toast.success("Álbum excluído."); } catch { toast.error("Erro ao excluir álbum."); } }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            <InstagramWidget />
          </>
        ) : (
          <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
            className={`transition-all rounded-xl ${dragOver ? "ring-2 ring-primary bg-primary/5 p-2" : ""}`}>
            {photosLoading ? (
              <GridSkeleton cols={4} count={12} />
            ) : photos.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl space-y-3">
                <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="font-medium">Nenhuma foto ainda</p>
                <p className="text-sm text-muted-foreground">Arraste fotos aqui ou clique em &quot;Adicionar fotos&quot;</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {photos.map((photo, i) => (
                    <motion.button key={photo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setLightbox(pbFileUrl("gallery_photos", photo.id, photo.file))}
                      className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                      <Image src={pbFileUrl("gallery_photos", photo.id, photo.file, "400x400")}
                        alt={photo.caption ?? ""} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      {photo.caption && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="text-white text-[10px] line-clamp-2">{photo.caption}</p>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
                {photosHasMore && (
                  <div className="flex justify-center pt-4">
                    <button onClick={photosLoadMore}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
                      Carregar mais fotos
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out">
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-full max-w-5xl">
              <Image src={lightbox} alt="" fill className="object-contain" unoptimized />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
