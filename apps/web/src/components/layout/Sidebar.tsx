"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";
import {
  Home, Bell, MessageSquare, Newspaper, BookOpen, LayoutGrid,
  Users, GitBranch, Cake, Briefcase, Gift, BarChart2,
  Image, ShoppingBag, Star, Calendar,
  FileText, BookMarked, GraduationCap,
  Layers, CheckSquare, Link2,
  User, LifeBuoy, ShieldCheck, PieChart,
  Menu, PanelLeftClose,
} from "lucide-react";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    items: [{ href: "/", icon: Home, label: "Início" }],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/avisos",   icon: Bell,          label: "Avisos" },
      { href: "/chat",     icon: MessageSquare, label: "Chat" },
      { href: "/noticias", icon: Newspaper,     label: "Notícias" },
      { href: "/blog",     icon: BookOpen,      label: "Blog" },
      { href: "/mural",    icon: LayoutGrid,    label: "Mural" },
    ],
  },
  {
    label: "RH & Pessoas",
    items: [
      { href: "/pessoas",          icon: Users,      label: "Pessoas" },
      { href: "/organograma",      icon: GitBranch,  label: "Organograma" },
      { href: "/aniversariantes",  icon: Cake,       label: "Aniversariantes" },
      { href: "/vagas",            icon: Briefcase,  label: "Vagas" },
      { href: "/beneficios",       icon: Gift,       label: "Benefícios" },
      { href: "/pesquisas",        icon: BarChart2,  label: "Pesquisas" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { href: "/galeria",       icon: Image,       label: "Galeria" },
      { href: "/classificados", icon: ShoppingBag, label: "Classificados" },
      { href: "/conquistas",    icon: Star,        label: "Conquistas" },
      { href: "/calendario",    icon: Calendar,    label: "Calendário" },
    ],
  },
  {
    label: "Conhecimento",
    items: [
      { href: "/documentos",   icon: FileText,       label: "Documentos" },
      { href: "/wiki",         icon: BookMarked,     label: "Wiki" },
      { href: "/treinamentos", icon: GraduationCap,  label: "Treinamentos" },
    ],
  },
  {
    label: "Colaboração",
    items: [
      { href: "/grupos",  icon: Layers,       label: "Grupos" },
      { href: "/tarefas", icon: CheckSquare,  label: "Tarefas" },
      { href: "/links",   icon: Link2,        label: "Links Úteis" },
    ],
  },
  {
    items: [{ href: "/perfil", icon: User, label: "Perfil" }],
  },
  {
    label: "TI & Admin",
    items: [
      { href: "/chamados",   icon: LifeBuoy,    label: "Chamados" },
      { href: "/admin",      icon: ShieldCheck, label: "Admin",      adminOnly: true },
      { href: "/relatorios", icon: PieChart,    label: "Relatórios", adminOnly: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const isAdmin = myRole === "admin";

  useEffect(() => {
    if (localStorage.getItem("sidebar-pinned") === "true") setPinned(true);
  }, []);

  function togglePin() {
    const next = !pinned;
    setPinned(next);
    localStorage.setItem("sidebar-pinned", String(next));
  }

  const expanded = pinned || hovered;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden z-30",
        "transition-[width] duration-200 ease-in-out",
        expanded ? "w-[220px]" : "w-[52px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center h-[56px] border-b border-sidebar-border shrink-0 px-2 gap-2">
        {expanded ? (
          <>
            <Link href="/" className="w-[32px] h-[32px] rounded-xl bg-primary flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity">
              <Home className="text-primary-foreground" style={{ width: 15, height: 15 }} />
            </Link>
            <span className="font-semibold text-sm text-sidebar-foreground/80 truncate flex-1">Intranet</span>
            <button
              onClick={togglePin}
              title="Fechar menu fixo"
              className="w-[28px] h-[28px] flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-all shrink-0"
            >
              <PanelLeftClose style={{ width: 16, height: 16 }} />
            </button>
          </>
        ) : (
          <button
            onClick={togglePin}
            title="Fixar menu aberto"
            className="w-[36px] h-[36px] flex items-center justify-center rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-all shrink-0"
          >
            <Menu style={{ width: 18, height: 18 }} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-1 pb-4 text-sidebar-foreground">
        {SECTIONS.map((section, si) => (
          <div key={si} className="w-full">
            {si > 0 && (
              <div className={cn(
                "border-t border-sidebar-border/40 mt-1",
                expanded ? "mx-3" : "mx-2"
              )} />
            )}
            {expanded && section.label && (
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/30 px-3 pt-2 pb-0.5 truncate">
                {section.label}
              </p>
            )}
            {section.items.map(({ href, icon: Icon, label, adminOnly }) => {
              if (adminOnly && !isAdmin) return null;
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={!expanded ? label : undefined}
                  className="relative flex items-center py-[2px] px-2 group"
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[26px] bg-primary rounded-r-full" />
                  )}
                  <div className={cn(
                    "flex items-center justify-center w-[36px] h-[34px] rounded-xl transition-all duration-150 shrink-0",
                    active
                      ? "bg-primary/20 text-primary"
                      : "text-sidebar-foreground/65 group-hover:bg-sidebar-foreground/10 group-hover:text-sidebar-foreground"
                  )}>
                    <Icon style={{ width: 17, height: 17 }} strokeWidth={active ? 2.2 : 1.7} />
                  </div>
                  {expanded && (
                    <span className={cn(
                      "ml-2 text-sm truncate",
                      active ? "text-primary font-medium" : "text-sidebar-foreground/70"
                    )}>
                      {label}
                    </span>
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
