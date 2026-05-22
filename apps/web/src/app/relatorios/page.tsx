"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="📈"
      title="Relatórios"
      description="Dashboards de engajamento, uso por setor e indicadores de saúde da intranet."
      features={[
        "Gráfico de posts e interações por semana",
        "Chamados por categoria e tempo médio de resolução",
        "Top colaboradores mais ativos",
        "Taxa de adoção por departamento",
        "Exportação de relatórios em PDF",
      ]}
    />
  );
}
