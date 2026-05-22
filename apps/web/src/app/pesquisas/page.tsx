"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="📊"
      title="Pesquisas"
      description="Enquetes de clima organizacional, NPS interno e pesquisas de satisfação para toda a equipe."
      features={[
        "Criação de enquetes com múltipla escolha ou escala 1–10",
        "Pesquisa de clima organizacional anônima",
        "NPS interno trimestral automatizado",
        "Resultados em tempo real com gráficos",
        "Exportação de respostas em CSV/PDF",
      ]}
    />
  );
}
