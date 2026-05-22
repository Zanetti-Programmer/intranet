"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="📰"
      title="Notícias"
      description="Artigos e comunicados oficiais da empresa, com leitura completa, categorias e busca."
      features={[
        "Artigos longos com editor rich-text",
        "Imagem de capa e tags por categoria",
        "Destaque de notícias no feed principal",
        "Notificação push para publicações importantes",
        "Arquivo histórico de notícias anteriores",
      ]}
    />
  );
}
