"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="👥"
      title="Grupos & Espaços"
      description="Times e departamentos com feed próprio, membros e conteúdo exclusivo por grupo."
      features={[
        "Criar grupos públicos ou privados por departamento",
        "Feed de posts exclusivo de cada grupo",
        "Gerenciamento de membros e permissões",
        "Eventos e comunicados específicos do grupo",
        "Integração com o Chat para canais de grupo",
      ]}
    />
  );
}
