"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";
import {
  Home, Bell, MessageSquare, Users, Image, Calendar,
  ShoppingBag, Star, User, Briefcase, Menu, PanelLeftClose,
} from "lucide-react";

const GROUPS: { href: string; icon: React.ForwardRefExoticComponent<LucideProps>; label: string }[][] = [
  [
    { href: "/",              icon: Home,          label: "Início" },
  ],
  [
    { href: "/avisos",        icon: Bell,          label: "Avisos" },
    { href: "/chat",          icon: MessageSquare, label: "Chat" },
    { href: "/pessoas",       icon: Users,         label: "Pessoas" },
    { href: "/galeria",       icon: Image,         label: "Galeria" },
    { href: "/calendario",    icon: Calendar,      label: "Calendário" },
    { href: "/classificados", icon: ShoppingBag,   label: "Classificados" },
  ],
  [
    { href: "/conquistas",    icon: Star,          label: "Conquistas" },
    { href: "/perfil",        icon: User,          label: "Perfil" },
  ],
  [
    { href: "/chamados",      icon: Briefcase,     label: "Chamados" },
  ],
];

export function Sidebar() {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

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
        <button
          onClick={togglePin}
          title={pinned ? "Desfixar menu" : "Fixar menu aberto"}
          className="w-[36px] h-[36px] flex items-center justify-center rounded-xl text-sidebar-foreground/50 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-all shrink-0"
        >
          {pinned
            ? <PanelLeftClose style={{ width: 18, height: 18 }} />
            : <Menu style={{ width: 18, height: 18 }} />
          }
        </button>
        {expanded && (
          <Link href="/" className="font-semibold text-sm text-sidebar-foreground/80 truncate hover:text-sidebar-foreground transition-colors">
            Intranet
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-2 pb-4 text-sidebar-foreground">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="w-full">
            {gi > 0 && (
              <div className={cn(
                "border-t border-sidebar-border/50 my-1.5 transition-[margin] duration-200",
                expanded ? "mx-3" : "mx-2"
              )} />
            )}
            {group.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={!expanded ? label : undefined}
                  className="relative flex items-center py-[3px] px-2 group"
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[28px] bg-primary rounded-r-full" />
                  )}
                  <div className={cn(
                    "flex items-center justify-center w-[36px] h-[36px] rounded-xl transition-all duration-150 shrink-0",
                    active
                      ? "bg-primary/20 text-primary"
                      : "text-sidebar-foreground/45 group-hover:bg-sidebar-foreground/10 group-hover:text-sidebar-foreground/80"
                  )}>
                    <Icon style={{ width: 18, height: 18 }} strokeWidth={active ? 2.2 : 1.7} />
                  </div>
                  {expanded && (
                    <span className={cn(
                      "ml-2 text-sm truncate transition-opacity duration-150",
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
