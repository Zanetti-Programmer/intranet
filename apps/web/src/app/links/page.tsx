"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="🔗"
      title="Links Úteis"
      description="Atalhos rápidos para todos os sistemas externos que a equipe usa no dia a dia."
      features={[
        "Cards com ícone, nome e descrição de cada sistema",
        "Categorias: ERP, E-mail, Drive, RH, Financeiro…",
        "Admin pode adicionar e organizar links",
        "Favoritos pessoais para os links mais usados",
        "Busca por nome ou categoria",
      ]}
    />
  );
}
