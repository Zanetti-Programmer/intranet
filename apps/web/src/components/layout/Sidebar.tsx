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

const NAV = [
  { href: "/",              icon: Home,          label: "Início" },
  { href: "/chat",          icon: MessageSquare, label: "Chat" },
  { href: "/avisos",        icon: Megaphone,     label: "Avisos" },
  { href: "/calendario",    icon: Calendar,      label: "Calendário" },
  { href: "/pessoas",       icon: Users,         label: "Pessoas" },
  { href: "/chamados",      icon: Ticket,        label: "Chamados TI" },
  { href: "/galeria",       icon: Image,         label: "Galeria" },
  { href: "/classificados", icon: ShoppingBag,   label: "Classificados" },
  { href: "/conquistas",    icon: Trophy,        label: "Conquistas" },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { spaces } = useSpaces();
  const activeSpace = searchParams?.get("space") ?? "";

  function handleSpaceClick(id: string) {
    if (pathname !== "/") router.push(`/?space=${id}`);
    else {
      const params = new URLSearchParams(searchParams?.toString());
      if (activeSpace === id) params.delete("space");
      else params.set("space", id);
      router.push(`/?${params.toString()}`);
    }
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0",
        collapsed && "justify-center px-0")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
              className="font-bold text-sidebar-foreground text-sm whitespace-nowrap">
              Intranet
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" && !activeSpace : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active && "text-sidebar-primary")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }} className="whitespace-nowrap">
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Spaces section */}
        <AnimatePresence>
          {!collapsed && spaces.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="pt-3">
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Espaços
              </p>
              {spaces.map((s) => {
                const active = activeSpace === s.id;
                return (
                  <button key={s.id} onClick={() => handleSpaceClick(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="truncate">{s.name}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors shadow-md">
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
