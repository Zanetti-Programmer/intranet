"use client";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

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

function getTitle(pathname: string) {
  if (pathname.startsWith("/chat")) return "Chat";
  return PAGE_TITLES[pathname] ?? "Intranet";
}

export function DashboardLayout({
  children,
  pathname,
  fullHeight = false,
}: {
  children: React.ReactNode;
  pathname: string;
  fullHeight?: boolean;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<div className="w-14 h-screen bg-sidebar border-r border-sidebar-border shrink-0" />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={getTitle(pathname)} />
        <main className={cn("flex-1 overflow-hidden", !fullHeight && "overflow-y-auto")}>
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
