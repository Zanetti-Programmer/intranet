"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Loader2, Cake } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function parseBirthday(birthday: string): { month: number; day: number } | null {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return null;
  return { month: d.getUTCMonth(), day: d.getUTCDate() };
}

function daysUntilBirthday(birthday: string): number {
  const parsed = parseBirthday(birthday);
  if (!parsed) return 9999;
  const today = new Date();
  const next = new Date(today.getFullYear(), parsed.month, parsed.day);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.floor((next.getTime() - today.getTime()) / 86400000);
}

function isToday(birthday: string): boolean {
  return daysUntilBirthday(birthday) === 0;
}

function isThisMonth(birthday: string): boolean {
  const parsed = parseBirthday(birthday);
  if (!parsed) return false;
  return parsed.month === new Date().getMonth();
}

function BirthdayRow({ user, index }: { user: User; index: number }) {
  const today = isToday(user.birthday ?? "");
  const parsed = parseBirthday(user.birthday ?? "");
  const days = daysUntilBirthday(user.birthday ?? "");

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        today ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-muted/50"
      )}
    >
      <div className="relative">
        <UserAvatar user={user} size="md" />
        {today && (
          <span className="absolute -top-1 -right-1 text-sm">🎂</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.name}</p>
        {user.department && (
          <p className="text-xs text-muted-foreground truncate">{user.department}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        {today ? (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">Hoje! 🎉</span>
        ) : parsed ? (
          <span className="text-xs text-muted-foreground">
            {days <= 30 ? `em ${days}d` : `dia ${parsed.day}`}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

function Section({ title, users, emoji }: { title: string; users: User[]; emoji: string }) {
  if (users.length === 0) return null;
  return (
    <div className="space-y-1">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
        <span>{emoji}</span> {title}
        <span className="ml-1 bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[10px]">{users.length}</span>
      </h2>
      <div className="space-y-0.5">
        {users.map((u, i) => <BirthdayRow key={u.id} user={u} index={i} />)}
      </div>
    </div>
  );
}

export default function AniversariantesPage() {
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getFullList({ sort: "name" })
      .then((r) => setUsers((r as unknown as User[]).filter((u) => u.birthday)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = users.filter((u) => isToday(u.birthday ?? ""));
  const thisMonth = users.filter((u) => !isToday(u.birthday ?? "") && isThisMonth(u.birthday ?? ""))
    .sort((a, b) => (parseBirthday(a.birthday ?? "")?.day ?? 0) - (parseBirthday(b.birthday ?? "")?.day ?? 0));
  const next30 = users
    .filter((u) => {
      const d = daysUntilBirthday(u.birthday ?? "");
      return d > 0 && d <= 30 && !isThisMonth(u.birthday ?? "");
    })
    .sort((a, b) => daysUntilBirthday(a.birthday ?? "") - daysUntilBirthday(b.birthday ?? ""));

  const byMonth: Record<number, User[]> = {};
  users.forEach((u) => {
    const parsed = parseBirthday(u.birthday ?? "");
    if (!parsed) return;
    const m = parsed.month;
    const days = daysUntilBirthday(u.birthday ?? "");
    if (isToday(u.birthday ?? "") || isThisMonth(u.birthday ?? "") || days <= 30) return;
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(u);
  });

  const currentMonth = new Date().getMonth();

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Cake className="w-5 h-5 text-primary" />
              Aniversariantes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {MONTHS[currentMonth]} · {users.length} colaboradores com data cadastrada
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🎂</p>
            <p className="font-medium">Nenhum aniversário cadastrado</p>
            <p className="text-sm text-muted-foreground">Os colaboradores precisam preencher a data de nascimento no perfil.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Hoje" users={today} emoji="🎂" />
            <Section title={`Este mês — ${MONTHS[currentMonth]}`} users={thisMonth} emoji="📅" />
            <Section title="Próximos 30 dias" users={next30} emoji="⏳" />
            {Object.entries(byMonth)
              .sort(([a], [b]) => {
                const ma = (parseInt(a) - currentMonth + 12) % 12;
                const mb = (parseInt(b) - currentMonth + 12) % 12;
                return ma - mb;
              })
              .map(([month, list]) => (
                <Section key={month} title={MONTHS[parseInt(month)]} users={list} emoji="📆" />
              ))
            }
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
