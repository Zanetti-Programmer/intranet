"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="📚"
      title="Wiki Corporativa"
      description="Base de conhecimento com FAQ, tutoriais, processos e guias internos sempre atualizados."
      features={[
        "Artigos organizados por categoria e tags",
        "Busca full-text em todo o conteúdo",
        "Editor colaborativo — qualquer um pode sugerir edição",
        "Histórico de versões de cada artigo",
        "Avaliação de utilidade (👍 útil / 👎 desatualizado)",
      ]}
    />
  );
}
