"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, LayoutGrid, Zap, Mail, User, Radio,
  MessageSquare, Calendar, FileText, Star, Settings, Briefcase,
} from "lucide-react";

// Exatamente como no Alliance: grupos separados por 3 pontinhos verticais
const GROUPS = [
  [
    { href: "/",              icon: Home,          label: "Início" },
  ],
  [
    { href: "/",              icon: LayoutGrid,    label: "Atividade" },
    { href: "/avisos",        icon: Zap,           label: "Avisos" },
    { href: "/chat",          icon: Mail,          label: "Mensagens" },
    { href: "/pessoas",       icon: User,          label: "Membros" },
    { href: "/",              icon: Radio,         label: "Grupos" },
    { href: "/chat",          icon: MessageSquare, label: "Fóruns" },
    { href: "/calendario",    icon: Calendar,      label: "Eventos" },
    { href: "/galeria",       icon: FileText,      label: "Documentos" },
  ],
  [
    { href: "/conquistas",    icon: Star,          label: "Conquistas" },
    { href: "/classificados", icon: Settings,      label: "Classificados" },
  ],
  [
    { href: "/chamados",      icon: Briefcase,     label: "Chamados" },
  ],
];

function ThreeDots() {
  return (
    <div className="flex flex-col items-center gap-[5px] py-3">
      <span className="w-[4px] h-[4px] rounded-full bg-sidebar-foreground/25" />
      <span className="w-[4px] h-[4px] rounded-full bg-sidebar-foreground/25" />
      <span className="w-[4px] h-[4px] rounded-full bg-sidebar-foreground/25" />
    </div>
  );
}

export function Sidebar() {
  const pathname  = usePathname();
  const searchParams = useSearchParams();
  const activeSpace  = searchParams?.get("space") ?? "";

  function isActive(href: string, label: string) {
    if (label === "Atividade" || label === "Grupos") return false;
    if (href === "/") return pathname === "/" && !activeSpace && label === "Início";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col h-screen w-[52px] bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Topo — mesma altura do topbar */}
      <div className="flex items-center justify-center h-[56px] border-b border-sidebar-border shrink-0">
        <div className="w-[30px] h-[30px] rounded-lg bg-primary flex items-center justify-center">
          <Home className="w-[15px] h-[15px] text-white" />
        </div>
      </div>

      {/* Ícones agrupados */}
      <nav className="flex flex-col items-center flex-1 overflow-y-auto pt-2 pb-4">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="w-full flex flex-col items-center">
            {gi > 0 && <ThreeDots />}
            {group.map(({ href, icon: Icon, label }) => {
              const active = isActive(href, label);
              return (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  title={label}
                  className="relative w-full flex justify-center items-center py-[6px]"
                >
                  {/* Retângulo azul de fundo no item ativo — igual Alliance */}
                  <div className={cn(
                    "flex items-center justify-center w-[36px] h-[36px] rounded-xl transition-all duration-150",
                    active
                      ? "bg-primary/20"
                      : "hover:bg-sidebar-foreground/8"
                  )}>
                    <Icon
                      className={cn(
                        "transition-colors duration-150",
                        active
                          ? "text-primary"
                          : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground"
                      )}
                      style={{ width: 18, height: 18 }}
                      strokeWidth={active ? 2.2 : 1.7}
                    />
                  </div>
                  {/* Barra azul na borda esquerda quando ativo */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[28px] bg-primary rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
