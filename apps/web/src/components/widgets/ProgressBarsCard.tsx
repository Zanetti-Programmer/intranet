"use client";
import { useEffect, useState } from "react";
import getPocketBase from "@/lib/pocketbase";

interface Bar { label: string; value: number; color: string }

export function ProgressBarsCard() {
  const [bars, setBars] = useState<Bar[]>([
    { label: "Chamados Resolvidos", value: 0, color: "#3b82f6" },
    { label: "Colaboradores Ativos", value: 0, color: "#22c55e" },
    { label: "Conquistas",           value: 0, color: "#10b981" },
  ]);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;

    Promise.all([
      pb.collection("tickets").getList(1, 1, { filter: 'status = "resolvido" || status = "fechado"' }),
      pb.collection("tickets").getList(1, 1),
      pb.collection("users").getList(1, 1),
      pb.collection("achievements").getList(1, 1),
    ]).then(([resolved, total, users, achievements]) => {
      const pct = (a: number, b: number) => b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;
      setBars([
        { label: "Chamados Resolvidos", value: pct(resolved.totalItems, total.totalItems || 1), color: "#3b82f6" },
        { label: "Colaboradores",       value: Math.min(100, (users.totalItems / 20) * 100), color: "#22c55e" },
        { label: "Conquistas",          value: Math.min(100, achievements.totalItems * 10), color: "#10b981" },
      ]);
    }).catch(() => {
      setBars([
        { label: "Web Designer", value: 80, color: "#3b82f6" },
        { label: "Development",  value: 60, color: "#22c55e" },
        { label: "Support",      value: 90, color: "#10b981" },
      ]);
    });
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Progress Bar</h3>
      </div>
      <div className="border-t border-border/60" />

      <div className="px-5 py-4 space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium">{bar.label}</span>
              <span className="text-[11px] font-bold text-muted-foreground">{bar.value}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
