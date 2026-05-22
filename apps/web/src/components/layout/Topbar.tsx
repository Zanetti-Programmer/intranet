"use client";
import { useState } from "react";
import { Bell, Sun, Moon, LogOut, User as UserIcon, Search, Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useAchievements";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, getPBBaseUrl } from "@/lib/utils";

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function Topbar({ title: _title }: { title?: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { count, notifications, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");

  const avatarUrl = user?.avatar
    ? `${getPBBaseUrl()}/api/files/users/${user.id}/${user.avatar}?thumb=40x40`
    : undefined;

  function handleLogout() { logout(); router.push("/login"); }

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center gap-3 px-4 shrink-0 z-10">
      {/* Search bar — center */}
      <div className="flex-1 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="w-full h-9 pl-9 pr-4 rounded-xl bg-muted border-0 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); if (count > 0) markAllRead(); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center leading-none">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold">Notificações</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Sem notificações</p>
                ) : notifications.map((n) => (
                  <Link key={n.id} href={n.link ?? "#"} onClick={() => setNotifOpen(false)}
                    className="flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm shrink-0">
                      {n.type === "achievement" ? "🏆" : "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-2">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(n.created)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User — "Hi, Name" style */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors outline-none">
            <Avatar className="w-7 h-7">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Olá,</span>
              <span className="text-xs font-semibold">{user?.name?.split(" ")[0] ?? "Usuário"}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={() => router.push("/perfil")}>
              <UserIcon className="w-4 h-4 mr-2" /> Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
