"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { UploadDocumentModal } from "@/components/documents/UploadDocumentModal";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Search, FolderOpen } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

const FILTERS = ["Todos", "Políticas", "Procedimentos", "Formulários", "Comunicados", "Outros"];

export default function DocumentosPage() {
  const pathname = usePathname();
  const { documents, loading, createDocument } = useDocuments();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canUpload = myRole === "admin" || myRole === "rh" || myRole === "ti";

  const filtered = useMemo(() => {
    return documents
      .filter((d) => filter === "Todos" || d.category === filter)
      .filter((d) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return d.title.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q);
      });
  }, [documents, filter, search]);

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Documentos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Políticas, procedimentos, formulários e comunicados da empresa
            </p>
          </div>
          {canUpload && (
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Upload
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar documentos..." className="pl-9 h-9" />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-2">
            <p className="text-4xl">📄</p>
            <p className="font-medium">Nenhum documento encontrado</p>
            <p className="text-sm text-muted-foreground">
              {canUpload ? "Clique em 'Upload' para adicionar o primeiro documento." : "Nenhum documento disponível ainda."}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc, i) => (
              <DocumentCard key={doc.id} document={doc} index={i} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <UploadDocumentModal
            onSubmit={createDocument}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
