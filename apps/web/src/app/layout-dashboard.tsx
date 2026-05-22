"use client";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const PAGE_TITLES: Record<string, string> = {
  "/":              "Início",
  "/chat":          "Chat",
  "/avisos":        "Avisos",
  "/calendario":    "Calendário",
  "/pessoas":       "Pessoas",
  "/chamados":      "Chamados TI",
  "/galeria":       "Galeria",
  "/classificados": "Classificados",
  "/conquistas":    "Conquistas",
  "/perfil":        "Meu Perfil",
};

export function DashboardLayout({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const title = PAGE_TITLES[pathname] ?? "Intranet";
  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<div className="w-14 h-screen bg-sidebar border-r border-sidebar-border shrink-0" />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
