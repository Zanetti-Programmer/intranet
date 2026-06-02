"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useChannels } from "@/lib/hooks/useChannels";
import { Loader2, Cake, MessageCircle, ChevronDown } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

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

function getAge(b: string): number | null {
  const p = parseBirthday(b);
  if (!p) return null;
  const today = new Date();
  let age = today.getFullYear() - parseInt(b.slice(0, 4), 10);
  if (today.getMonth() < p.month || (today.getMonth() === p.month && today.getDate() < p.day)) age--;
  return age > 0 ? age : null;
}

function isToday(b: string)     { return daysUntil(b) === 0; }
function isThisMonth(b: string) { const p = parseBirthday(b); return !!p && p.month === new Date().getMonth(); }

// ── Birthday notification (once per day) ─────────────────────────────────────

function useBirthdayNotifications(users: User[]) {
  useEffect(() => {
    if (!users.length) return;
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    const myId = pb.authStore.record?.id;
    const todayKey = `bday-notif-${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(todayKey)) return;

    const todayBirthdays = users.filter((u) => u.id !== myId && isToday(u.birthday ?? ""));
    if (!todayBirthdays.length) return;

    localStorage.setItem(todayKey, "1");
    todayBirthdays.forEach((u) => {
      const age = getAge(u.birthday!);
      pb.collection("notifications").create({
        user: myId,
        type: "birthday",
        content: `🎂 Hoje é aniversário de ${u.name}${age ? ` — ${age} anos!` : "!"}`,
        read: false,
        link: "/aniversariantes",
      }).catch(() => {});
    });
  }, [users]);
}

// ── Birthday row ───────────────────────────────────────────────────────────────

function BirthdayRow({ user, index, onDM }: {
  user: User; index: number; onDM: (id: string) => void;
}) {
  const myId  = getPocketBase().authStore.record?.id;
  const today = isToday(user.birthday ?? "");
  const days  = daysUntil(user.birthday ?? "");
  const p     = parseBirthday(user.birthday ?? "");
  const age   = getAge(user.birthday ?? "");
  const turnsAge = age !== null ? (today ? age : age + 1) : null;

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn("flex items-center gap-3 p-3 rounded-xl transition-colors group",
        today ? "bg-pink-500/10 border border-pink-500/20" : "hover:bg-muted/50")}>

      <div className="relative shrink-0">
        <UserAvatar user={user} size="md" />
        {today && <span className="absolute -top-1 -right-1 text-sm">🎂</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{user.name}</p>
          {turnsAge && (
            <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full font-medium",
              today ? "bg-pink-500/15 text-pink-400" : "bg-muted text-muted-foreground")}>
              {today ? `${turnsAge} anos 🎉` : `fará ${turnsAge}`}
            </span>
          )}
        </div>
        {user.department && (
          <p className="text-xs text-muted-foreground">{user.department}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          {today ? (
            <span className="text-xs font-semibold text-pink-400">Hoje!</span>
          ) : p ? (
            <span className="text-xs text-muted-foreground">
              {days === 1 ? "Amanhã" : days <= 30 ? `em ${days}d` : `${String(p.day).padStart(2,"0")}/${String(p.month+1).padStart(2,"0")}`}
            </span>
          ) : null}
        </div>
        {user.id !== myId && (
          <button onClick={() => onDM(user.id)} title="Enviar parabéns"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
            <MessageCircle style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────

function Section({ title, users, emoji, onDM, defaultOpen = true }: {
  title: string; users: User[]; emoji: string;
  onDM: (id: string) => void; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!users.length) return null;
  return (
    <div className="space-y-1">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-1 py-0.5 hover:text-foreground transition-colors">
        <span>{emoji}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <span className="ml-1 bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[10px]">{users.length}</span>
        <ChevronDown style={{ width: 12, height: 12 }}
          className={cn("ml-auto text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="space-y-0.5">
              {users.map((u, i) => <BirthdayRow key={u.id} user={u} index={i} onDM={onDM} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AniversariantesPage() {
  const pathname = usePathname();
  const router   = useRouter();
  const { createDM } = useChannels();

  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("todos");

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    pb.collection("users").getFullList({ sort: "name" })
      .then((r) => setUsers((r as unknown as User[]).filter((u) => u.birthday)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useBirthdayNotifications(users);

  const depts = useMemo(() =>
    ["todos", ...Array.from(new Set(users.map((u) => u.department).filter(Boolean) as string[])).sort()],
  [users]);

  const filtered = useMemo(() =>
    deptFilter === "todos" ? users : users.filter((u) => u.department === deptFilter),
  [users, deptFilter]);

  const todayList = filtered.filter((u) => isToday(u.birthday ?? ""));
  const thisMonthList = filtered
    .filter((u) => !isToday(u.birthday ?? "") && isThisMonth(u.birthday ?? ""))
    .sort((a, b) => (parseBirthday(a.birthday ?? "")?.day ?? 0) - (parseBirthday(b.birthday ?? "")?.day ?? 0));
  const next30 = filtered
    .filter((u) => { const d = daysUntil(u.birthday ?? ""); return d > 0 && d <= 30 && !isThisMonth(u.birthday ?? ""); })
    .sort((a, b) => daysUntil(a.birthday ?? "") - daysUntil(b.birthday ?? ""));

  const byMonth: Record<number, User[]> = {};
  filtered.forEach((u) => {
    const p = parseBirthday(u.birthday ?? "");
    if (!p) return;
    const d = daysUntil(u.birthday ?? "");
    if (isToday(u.birthday ?? "") || isThisMonth(u.birthday ?? "") || (d > 0 && d <= 30)) return;
    if (!byMonth[p.month]) byMonth[p.month] = [];
    byMonth[p.month].push(u);
  });

  const currentMonth = new Date().getMonth();

  async function handleDM(userId: string) {
    const channelId = await createDM(userId);
    router.push(`/chat/${channelId}`);
  }

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-400" /> Aniversariantes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MONTHS[currentMonth]} · {users.length} colaboradores com data cadastrada
          </p>
        </div>

        {/* Banner: aniversários de hoje */}
        {!loading && todayList.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-pink-500/15 border border-pink-500/30 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-semibold text-sm">
                {todayList.length === 1
                  ? `Hoje é aniversário de ${todayList[0].name}!`
                  : `Hoje é aniversário de ${todayList.map(u => u.name).join(", ")}!`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Mande uma mensagem de parabéns 🎂</p>
            </div>
          </motion.div>
        )}

        {/* Dept filter */}
        {depts.length > 2 && (
          <div className="flex gap-1.5 flex-wrap">
            {depts.map((d) => (
              <button key={d} onClick={() => setDeptFilter(d)}
                className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                  deptFilter === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground")}>
                {d === "todos" ? "Todos" : d}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🎂</p>
            <p className="font-medium">Nenhum aniversário cadastrado</p>
            <p className="text-sm text-muted-foreground">Os colaboradores precisam preencher a data de nascimento no perfil.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Hoje" users={todayList} emoji="🎂" onDM={handleDM} defaultOpen />
            <Section title={`Este mês — ${MONTHS[currentMonth]}`} users={thisMonthList} emoji="📅" onDM={handleDM} defaultOpen />
            <Section title="Próximos 30 dias" users={next30} emoji="⏳" onDM={handleDM} defaultOpen />
            {Object.entries(byMonth)
              .sort(([a], [b]) => {
                const ma = (parseInt(a) - currentMonth + 12) % 12;
                const mb = (parseInt(b) - currentMonth + 12) % 12;
                return ma - mb;
              })
              .map(([month, list]) => (
                <Section key={month} title={MONTHS[parseInt(month)]}
                  users={list.sort((a,b) => (parseBirthday(a.birthday ?? "")?.day ?? 0) - (parseBirthday(b.birthday ?? "")?.day ?? 0))}
                  emoji="📆" onDM={handleDM} defaultOpen={false} />
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
