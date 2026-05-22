"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, MessageSquare, Calendar, Users, Megaphone,
  Ticket, Image, ShoppingBag, Trophy, Zap, Send,
  Star, Settings, Briefcase,
} from "lucide-react";
import { useSpaces } from "@/lib/hooks/useSpaces";

// Grupos de ícones separados por pontos — igual ao Alliance
const GROUPS = [
  [
    { href: "/",             icon: Home,          label: "Início" },
  ],
  [
    { href: "/chat",         icon: MessageSquare, label: "Mensagens" },
    { href: "/avisos",       icon: Megaphone,     label: "Avisos" },
    { href: "/pessoas",      icon: Users,         label: "Membros" },
    { href: "/chamados",     icon: Ticket,        label: "Chamados" },
    { href: "/calendario",   icon: Calendar,      label: "Calendário" },
    { href: "/galeria",      icon: Image,         label: "Galeria" },
  ],
  [
    { href: "/conquistas",   icon: Star,          label: "Conquistas" },
    { href: "/classificados",icon: ShoppingBag,   label: "Classificados" },
  ],
];

function Dot() {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-sidebar-foreground/20" />)}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSpace = searchParams?.get("space") ?? "";

  function isActive(href: string) {
    if (href === "/") return pathname === "/" && !activeSpace;
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col h-screen w-[52px] bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden">
      {/* Logo icon */}
      <div className="flex items-center justify-center h-14 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Home className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 flex flex-col items-center py-3 overflow-y-auto gap-0.5">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="w-full flex flex-col items-center">
            {gi > 0 && <Dot />}
            {group.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className="relative w-full flex items-center justify-center h-10 group"
                >
                  {/* Active indicator — left blue bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-r-full" />
                  )}
                  <div className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                    active
                      ? "text-primary"
                      : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground group-hover:bg-sidebar-accent/50"
                  )}>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 1.8} />
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
