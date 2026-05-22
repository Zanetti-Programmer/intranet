"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home, MessageSquare, Calendar, Users, Megaphone,
  Ticket, Image, ShoppingBag, Trophy, ChevronLeft, ChevronRight, Building2,
} from "lucide-react";
import { useState } from "react";
import { useSpaces } from "@/lib/hooks/useSpaces";

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: "/",     icon: Home,     label: "Início" },
      { href: "/avisos", icon: Megaphone, label: "Avisos" },
    ],
  },
  {
    label: "COMUNIDADE",
    items: [
      { href: "/chat",      icon: MessageSquare, label: "Chat" },
      { href: "/pessoas",   icon: Users,         label: "Pessoas" },
      { href: "/calendario",icon: Calendar,      label: "Calendário" },
    ],
  },
  {
    label: "FERRAMENTAS",
    items: [
      { href: "/chamados",   icon: Ticket,   label: "Chamados TI" },
      { href: "/conquistas", icon: Trophy,   label: "Conquistas" },
    ],
  },
  {
    label: "MÍDIA",
    items: [
      { href: "/galeria",       icon: Image,       label: "Galeria" },
      { href: "/classificados", icon: ShoppingBag, label: "Classificados" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { spaces } = useSpaces();
  const activeSpace = searchParams?.get("space") ?? "";

  function isActive(href: string) {
    if (href === "/") return pathname === "/" && !activeSpace;
    return pathname.startsWith(href);
  }

  function handleSpaceClick(id: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (activeSpace === id) params.delete("space");
    else params.set("space", id);
    if (pathname !== "/") router.push(`/?${params.toString()}`);
    else router.push(`/?${params.toString()}`);
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 h-14 border-b border-sidebar-border shrink-0 px-4",
        collapsed && "justify-center px-0"
      )}>
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
              className="font-bold text-sidebar-foreground text-sm tracking-tight whitespace-nowrap">
              Intranet
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav with sections */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-4 px-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {/* Section label */}
            <AnimatePresence>
              {!collapsed && section.label && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-2.5 mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/35 select-none">
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-0.5">
              {section.items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-primary/20 text-primary"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      collapsed && "justify-center px-0 py-2.5"
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                          className="whitespace-nowrap">
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Spaces section */}
        <AnimatePresence>
          {!collapsed && spaces.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="px-2.5 mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/35 select-none">
                Espaços
              </p>
              <div className="space-y-0.5">
                {spaces.map((s) => {
                  const active = activeSpace === s.id;
                  return (
                    <button key={s.id} onClick={() => handleSpaceClick(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm transition-all",
                        active
                          ? "bg-primary/20 text-primary font-medium"
                          : "text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      <span className="text-sm leading-none">{s.icon}</span>
                      <span className="truncate text-[13px]">{s.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full ml-auto shrink-0"
                        style={{ backgroundColor: s.color }} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-[68px] z-10 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shadow-md">
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
