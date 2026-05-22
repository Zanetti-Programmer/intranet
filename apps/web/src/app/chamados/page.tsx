"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { TicketCard } from "@/components/tickets/TicketCard";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useTickets } from "@/lib/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

const STATUS_FILTERS = [
  { value: "todos",         label: "Todos" },
  { value: "aberto",        label: "Abertos" },
  { value: "em_andamento",  label: "Em andamento" },
  { value: "resolvido",     label: "Resolvidos" },
  { value: "fechado",       label: "Fechados" },
];

export default function ChamadosPage() {
  const pathname = usePathname();
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const { tickets, loading, createTicket } = useTickets(statusFilter);

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Chamados de TI</h1>
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Novo chamado
          </Button>
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : tickets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-2">
            <p className="text-3xl">🎉</p>
            <p className="font-medium">Nenhum chamado</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "todos" ? "Tudo certo por aqui!" : `Sem chamados com status "${statusFilter}"`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <TicketForm
            onSubmit={async (data) => { await createTicket(data); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
