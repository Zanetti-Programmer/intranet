"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="🎁"
      title="Benefícios"
      description="Consulte plano de saúde, vale-refeição, convênios e todas as regras dos benefícios da empresa."
      features={[
        "Cards por categoria: Saúde, Alimentação, Transporte, Educação",
        "Detalhes completos de cada benefício com regras",
        "Links diretos para portais e carteirinhas",
        "Calendário de reajustes e datas importantes",
        "FAQ de dúvidas frequentes sobre benefícios",
      ]}
    />
  );
}
