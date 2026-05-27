"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { NewAnnouncementModal } from "@/components/announcements/NewAnnouncementModal";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Search, Megaphone } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

const FILTERS = ["Todos", "Pinados", "Geral", "RH", "TI", "Comercial", "Outros"];

export default function AvisosPage() {
  const pathname = usePathname();
  const { announcements, loading, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canCreate = myRole === "admin" || myRole === "rh";

  const filtered = useMemo(() => {
    return announcements
      .filter((a) => {
        if (filter === "Pinados") return a.pinned;
        if (filter !== "Todos") return a.category === filter;
        return true;
      })
      .filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      });
  }, [announcements, filter, search]);

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Avisos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comunicados e informações importantes da empresa
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Novo aviso
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar avisos..."
            className="pl-9 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-2"
          >
            <p className="text-4xl">📢</p>
            <p className="font-medium">Nenhum aviso encontrado</p>
            <p className="text-sm text-muted-foreground">
              {canCreate
                ? "Clique em '+ Novo aviso' para publicar o primeiro."
                : "Nenhum aviso para esta categoria ainda."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a, i) => (
              <AnnouncementCard key={a.id} announcement={a} index={i}
                canEdit={canCreate}
                onUpdate={updateAnnouncement}
                onDelete={deleteAnnouncement} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <NewAnnouncementModal
            onSubmit={createAnnouncement}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
