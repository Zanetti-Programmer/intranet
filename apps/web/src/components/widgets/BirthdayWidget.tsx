"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cake } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

function parseBirthday(b: string): { month: number; day: number } | null {
  const parts = b.split("T")[0].split("-");
  if (parts.length < 3) return null;
  const month = parseInt(parts[1], 10) - 1;
  const day   = parseInt(parts[2], 10);
  return isNaN(month) || isNaN(day) ? null : { month, day };
}

function daysUntil(b: string): number {
  const p = parseBirthday(b);
  if (!p) return 9999;
  const today = new Date(); today.setHours(0,0,0,0);
  const next  = new Date(today.getFullYear(), p.month, p.day);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.floor((next.getTime() - today.getTime()) / 86400000);
}

export function BirthdayWidget() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<User[]>([]);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getFullList({ sort: "name" })
      .then((r) => {
        const withBday = (r as unknown as User[]).filter((u) => u.birthday);
        const sorted = withBday
          .map((u) => ({ u, days: daysUntil(u.birthday!) }))
          .sort((a, b) => a.days - b.days)
          .slice(0, 4)
          .map((x) => x.u);
        setUpcoming(sorted);
      }).catch(() => {});
  }, []);

  if (!upcoming.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Cake style={{ width: 15, height: 15 }} className="text-pink-400" />
        <h3 className="text-sm font-bold">Aniversariantes</h3>
      </div>
      <div className="border-t border-border/60" />

      <div className="divide-y divide-border/60">
        {upcoming.map((u) => {
          const days = daysUntil(u.birthday!);
          const isToday = days === 0;
          const p = parseBirthday(u.birthday!);
          return (
            <div key={u.id} className={cn(
              "flex items-center gap-2.5 px-4 py-2.5",
              isToday && "bg-pink-500/5"
            )}>
              <div className="relative shrink-0">
                <UserAvatar user={u} size="sm" />
                {isToday && <span className="absolute -top-1 -right-1 text-xs">🎂</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{u.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{u.department ?? ""}</p>
              </div>
              <span className={cn("text-[10px] font-medium shrink-0",
                isToday ? "text-pink-400" : "text-muted-foreground")}>
                {isToday ? "Hoje! 🎉" : days === 1 ? "Amanhã" : p ? `dia ${p.day}/${p.month + 1}` : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/60">
        <button onClick={() => router.push("/aniversariantes")}
          className="w-full text-[11px] text-muted-foreground hover:text-primary transition-colors text-center py-3">
          Ver todos os aniversariantes →
        </button>
      </div>
    </div>
  );
}
