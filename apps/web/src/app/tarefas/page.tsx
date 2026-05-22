"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="✅"
      title="Tarefas"
      description="To-dos pessoais e de equipe, com acompanhamento de progresso e prazos integrados."
      features={[
        "Lista de tarefas pessoais com prioridade e prazo",
        "Tarefas de equipe com responsável e status",
        "Visualização Kanban (A fazer → Em andamento → Concluído)",
        "Notificação de prazo se aproximando",
        "Relatório semanal de progresso automático",
      ]}
    />
  );
}
