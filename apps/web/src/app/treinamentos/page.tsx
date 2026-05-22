"use client";
export const dynamic = "force-dynamic";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
export default function Page() {
  return (
    <ComingSoonPage
      icon="🎓"
      title="Treinamentos"
      description="Vídeos, trilhas de onboarding e cursos internos para desenvolvimento contínuo da equipe."
      features={[
        "Trilhas por cargo (Onboarding, Liderança, Técnico)",
        "Vídeos internos com progresso por usuário",
        "Certificado digital ao concluir trilha",
        "Agenda de treinamentos presenciais",
        "Relatório de conclusão por departamento",
      ]}
    />
  );
}
