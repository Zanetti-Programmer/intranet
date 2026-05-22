"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="🖼️"
      title="Mural"
      description="Painel visual estilo Pinterest para parabéns, homenagens e recados especiais entre colegas."
      features={[
        "Cards visuais coloridos com foto e mensagem",
        "Categorias: Parabéns, Boas-vindas, Conquista, Despedida",
        "Reações com emojis e comentários",
        "Notificação para o homenageado",
        "Layout em grade com filtro por tipo de card",
      ]}
    />
  );
}
