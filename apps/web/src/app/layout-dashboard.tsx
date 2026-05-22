"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";
import { Loader2 } from "lucide-react";

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
  if (pathname.startsWith("/chamados")) return "Chamados TI";
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
  const router = useRouter();

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) {
      router.replace("/login");
    }
  }, [router]);

  const pb = getPocketBase();
  if (!pb.authStore.isValid) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
