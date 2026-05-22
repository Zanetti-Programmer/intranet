"use client";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/app/layout-dashboard";
import { cn } from "@/lib/utils";

interface Props {
  icon: string;
  title: string;
  description: string;
  features: string[];
  accentColor?: string;
}

export function ComingSoonPage({ icon, title, description, features, accentColor = "text-primary" }: Props) {
  const pathname = usePathname();

  return (
    <DashboardLayout pathname={pathname}>
      <div className="flex items-center justify-center min-h-full py-16 px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6 text-center"
        >
          {/* Icon */}
          <div className="text-6xl">{icon}</div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Em desenvolvimento
          </span>

          {/* Title & description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          </div>

          {/* Planned features */}
          <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              O que está planejado
            </p>
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className={cn("mt-0.5 shrink-0", accentColor)}>✦</span>
                <span className="text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
