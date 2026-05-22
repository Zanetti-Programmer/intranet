"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="✍️"
      title="Blog Corporativo"
      description="Líderes e colaboradores publicam conteúdo editorial: aprendizados, cases e cultura da empresa."
      features={[
        "Posts editoriais com editor de texto rico",
        "Perfil de autor destacado em cada post",
        "Comentários e reações dos colaboradores",
        "Tags e categorias por tema (cultura, tech, mercado)",
        "Newsletter automática para novos posts",
      ]}
    />
  );
}
