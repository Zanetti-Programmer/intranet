"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardLayout } from "../layout-dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Loader2, BarChart2, Users, FileText, Ticket, Trophy, MessageSquare } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface Stats {
  users: number;
  postsWeek: number;
  openTickets: number;
  achievements: number;
  ticketsByCategory: { category: string; count: number }[];
  topUsers: { user: User; count: number }[];
  recentActivity: { type: "post" | "ticket"; title: string; user?: User; created: string }[];
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(diff / 86400000);
  return days < 30 ? `${days}d atrás` : new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;

  useEffect(() => {
    if (myRole !== "admin" && myRole !== "rh") {
      router.replace("/");
      return;
    }
    loadStats();
  }, [myRole]);

  async function loadStats() {
    const pb = getPocketBase();
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 19).replace("T", " ");

      const [userList, postsWeekList, openTicketList, achievementList, allTickets, allPosts, recentPosts, recentTickets] =
        await Promise.all([
          pb.collection("users").getFullList({ fields: "id" }),
          pb.collection("posts").getFullList({ filter: `created >= "${weekAgo}"`, fields: "id" }),
          pb.collection("tickets").getFullList({ filter: 'status = "aberto" || status = "em_andamento"', fields: "id" }),
          pb.collection("achievements").getFullList({ fields: "id" }),
          pb.collection("tickets").getFullList({ fields: "id,category" }),
          pb.collection("posts").getFullList({ fields: "id,author", expand: "author" }),
          pb.collection("posts").getFullList({ sort: "-created", fields: "id,author,created", expand: "author", requestKey: "r1" }).then((r) => r.slice(0, 5)),
          pb.collection("tickets").getFullList({ sort: "-created", fields: "id,title,author,created", expand: "author", requestKey: "r2" }).then((r) => r.slice(0, 5)),
        ]);

      // Tickets by category
      const catMap: Record<string, number> = {};
      allTickets.forEach((t: any) => { catMap[t.category] = (catMap[t.category] || 0) + 1; });
      const ticketsByCategory = Object.entries(catMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top users by post count
      const userPostMap: Record<string, { user: User; count: number }> = {};
      allPosts.forEach((p: any) => {
        const u = p.expand?.author as User;
        if (!u) return;
        if (!userPostMap[u.id]) userPostMap[u.id] = { user: u, count: 0 };
        userPostMap[u.id].count++;
      });
      const topUsers = Object.values(userPostMap).sort((a, b) => b.count - a.count).slice(0, 5);

      // Recent activity mix
      const recentActivity = [
        ...recentPosts.map((p: any) => ({
          type: "post" as const,
          title: "Nova publicação no feed",
          user: p.expand?.author as User | undefined,
          created: p.created,
        })),
        ...recentTickets.map((t: any) => ({
          type: "ticket" as const,
          title: t.title || "Chamado de TI",
          user: t.expand?.author as User | undefined,
          created: t.created,
        })),
      ].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).slice(0, 10);

      setStats({
        users: userList.length,
        postsWeek: postsWeekList.length,
        openTickets: openTicketList.length,
        achievements: achievementList.length,
        ticketsByCategory,
        topUsers,
        recentActivity,
      });
    } catch { setStats(null); }
    finally { setLoading(false); }
  }

  if (myRole !== "admin" && myRole !== "rh") return null;

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral da atividade na intranet</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !stats ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">📊</p>
            <p className="font-medium text-muted-foreground">Erro ao carregar dados</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Usuários" value={stats.users} />
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Posts esta semana" value={stats.postsWeek} />
              <StatCard icon={<Ticket className="w-5 h-5" />} label="Chamados abertos" value={stats.openTickets} />
              <StatCard icon={<Trophy className="w-5 h-5" />} label="Conquistas" value={stats.achievements} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {stats.ticketsByCategory.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <h2 className="font-semibold text-sm">Chamados por categoria</h2>
                  <div className="space-y-3">
                    {(() => {
                      const max = Math.max(...stats.ticketsByCategory.map((c) => c.count), 1);
                      return stats.ticketsByCategory.map(({ category, count }) => (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground capitalize">{category || "Outros"}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((count / max) * 100)}%` }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {stats.topUsers.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <h2 className="font-semibold text-sm">Top colaboradores</h2>
                  <div className="space-y-3">
                    {stats.topUsers.map(({ user, count }, i) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-4">{i + 1}</span>
                        <UserAvatar user={user} size="sm" />
                        <span className="text-sm font-medium flex-1 truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{count} posts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {stats.recentActivity.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <h2 className="font-semibold text-sm">Atividade recente</h2>
                <div className="space-y-3">
                  {stats.recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        item.type === "post" ? "bg-blue-500/10" : "bg-amber-500/10")}>
                        {item.type === "post"
                          ? <MessageSquare style={{ width: 13, height: 13 }} className="text-blue-400" />
                          : <Ticket style={{ width: 13, height: 13 }} className="text-amber-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.title}</p>
                        {item.user && <p className="text-xs text-muted-foreground">{item.user.name}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(item.created)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
