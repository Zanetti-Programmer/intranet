"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="💼"
      title="Vagas Internas"
      description="Recrutamento interno — colaboradores se candidatam a novas oportunidades dentro da própria empresa."
      features={[
        "Publicação de vagas por RH com requisitos e salário",
        "Candidatura com 1 clique usando o perfil da intranet",
        "Status da candidatura em tempo real",
        "Notificação para colaboradores elegíveis",
        "Histórico de vagas abertas e encerradas",
      ]}
    />
  );
}
