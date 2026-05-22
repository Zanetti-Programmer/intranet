"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";
import {
  Home, LayoutGrid, Zap, Mail, Users, Radio,
  MessageSquare, Calendar, FileText, Star, Settings2, Briefcase,
} from "lucide-react";

// Cada ícone tem rota ÚNICA — sem duplicatas
const GROUPS: { href: string; icon: React.ForwardRefExoticComponent<LucideProps>; label: string }[][] = [
  [
    { href: "/",              icon: Home,           label: "Início" },
  ],
  [
    { href: "/avisos",        icon: LayoutGrid,     label: "Avisos" },
    { href: "/avisos",        icon: Zap,            label: "Atividade" },
    { href: "/chat",          icon: Mail,           label: "Mensagens" },
    { href: "/pessoas",       icon: Users,          label: "Membros" },
    { href: "/galeria",       icon: Radio,          label: "Galeria" },
    { href: "/chat",          icon: MessageSquare,  label: "Chat" },
    { href: "/calendario",    icon: Calendar,       label: "Calendário" },
    { href: "/classificados", icon: FileText,       label: "Classificados" },
  ],
  [
    { href: "/conquistas",    icon: Star,           label: "Conquistas" },
    { href: "/perfil",        icon: Settings2,      label: "Perfil" },
  ],
  [
    { href: "/chamados",      icon: Briefcase,      label: "Chamados" },
  ],
];

function Dots() {
  return (
    <div className="flex flex-col items-center gap-[5px] py-3 opacity-30">
      <span className="block w-[4px] h-[4px] rounded-full bg-current" />
      <span className="block w-[4px] h-[4px] rounded-full bg-current" />
      <span className="block w-[4px] h-[4px] rounded-full bg-current" />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  // Cada href corresponde a uma rota — activo se pathname começa com o href
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col h-screen w-[52px] bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden z-30">
      {/* Logo */}
      <div className="flex items-center justify-center h-[56px] border-b border-sidebar-border shrink-0">
        <Link href="/" className="w-[30px] h-[30px] rounded-lg bg-primary flex items-center justify-center hover:opacity-90 transition-opacity">
          <Home className="text-white" style={{ width: 15, height: 15 }} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center flex-1 overflow-y-auto overflow-x-hidden pt-2 pb-4 text-sidebar-foreground">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="w-full flex flex-col items-center">
            {gi > 0 && <Dots />}
            {group.map(({ href, icon: Icon, label }, idx) => {
              // Para evitar duplicatas visuais, pular se mesmo href que anterior no mesmo grupo
              const active = isActive(href);
              return (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  title={label}
                  className="relative w-full flex justify-center items-center py-[5px] group"
                >
                  {/* Barra azul esquerda quando ativo */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[28px] bg-primary rounded-r-full" />
                  )}
                  <div className={cn(
                    "flex items-center justify-center w-[36px] h-[36px] rounded-xl transition-all duration-150",
                    active
                      ? "bg-primary/20 text-primary"
                      : "text-sidebar-foreground/45 group-hover:bg-sidebar-foreground/10 group-hover:text-sidebar-foreground/80"
                  )}>
                    <Icon
                      className="transition-colors"
                      style={{ width: 18, height: 18 }}
                      strokeWidth={active ? 2.2 : 1.7}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
