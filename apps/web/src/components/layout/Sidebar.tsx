"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home, MessageSquare, Calendar, Users, Megaphone,
  Ticket, Image, ShoppingBag, Trophy, Building2,
  ChevronRight, BookOpen, Zap, Briefcase, FileText, Menu,
} from "lucide-react";
import { useState } from "react";
import { useSpaces } from "@/lib/hooks/useSpaces";

const NAV = [
  {
    label: null,
    items: [
      { href: "/", icon: Home, label: "Home Pages", hasArrow: true, highlight: true },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { href: "/avisos",   icon: BookOpen,       label: "Avisos" },
      { href: "/",         icon: Zap,            label: "Atividade" },
      { href: "/chat",     icon: MessageSquare,  label: "Mensagens" },
      { href: "/pessoas",  icon: Users,          label: "Membros" },
      { href: "/",         icon: Users,          label: "Grupos", hasArrow: true },
      { href: "/chamados", icon: FileText,       label: "Fóruns" },
      { href: "/calendario",icon: Calendar,      label: "Eventos", hasArrow: true },
      { href: "/galeria",  icon: Image,          label: "Documentos" },
    ],
  },
  {
    label: "FERRAMENTAS",
    items: [
      { href: "/chamados",   icon: Ticket,    label: "Chamados TI", hasArrow: true },
      { href: "/conquistas", icon: Trophy,    label: "Conquistas",  hasArrow: true },
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

  function isActive(href: string, label: string) {
    if (label === "Atividade" || label === "Grupos") return pathname === "/" && !activeSpace;
    if (href === "/") return pathname === "/" && !activeSpace && label === "Home Pages";
    return pathname.startsWith(href);
  }

  function handleSpaceClick(id: string) {
    const p = new URLSearchParams(searchParams?.toString());
    if (activeSpace === id) p.delete("space"); else p.set("space", id);
    router.push(`/?${p.toString()}`);
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 210 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 h-14 border-b border-sidebar-border shrink-0 px-4",
        collapsed && "justify-center px-0"
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-bold text-sidebar-foreground text-sm tracking-tight whitespace-nowrap">
              INTRANET
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="ml-auto text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            <AnimatePresence>
              {!collapsed && section.label && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 pt-1 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/35 select-none">
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            {section.items.map(({ href, icon: Icon, label, hasArrow }) => {
              const active = isActive(href, label);
              return (
                <Link key={`${href}-${label}`} href={href}
                  className={cn(
                    "flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13px] transition-all",
                    active
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    collapsed && "justify-center mx-1 px-0 py-2.5"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 truncate">
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && hasArrow && (
                    <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/30 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Spaces */}
        <AnimatePresence>
          {!collapsed && spaces.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-4">
              <p className="px-4 pt-1 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/35 select-none">
                Espaços
              </p>
              {spaces.map((s) => {
                const active = activeSpace === s.id;
                return (
                  <button key={s.id} onClick={() => handleSpaceClick(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13px] transition-all text-left",
                      active
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                    style={{ width: "calc(100% - 16px)" }}
                  >
                    <span className="text-sm leading-none">{s.icon}</span>
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="mx-auto mb-4 w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.aside>
  );
}
