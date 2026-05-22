"use client";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "./layout-dashboard";
import { motion } from "framer-motion";
import { Megaphone, Users, Ticket, Calendar } from "lucide-react";

const stats = [
  { label: "Avisos ativos",    value: "3",  icon: Megaphone, color: "text-amber-400" },
  { label: "Colaboradores",    value: "24", icon: Users,     color: "text-blue-400" },
  { label: "Chamados abertos", value: "7",  icon: Ticket,    color: "text-red-400" },
  { label: "Eventos este mês", value: "5",  icon: Calendar,  color: "text-green-400" },
];

export default function HomePage() {
  const pathname = usePathname();
  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2"
            >
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Feed</h2>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                  <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
