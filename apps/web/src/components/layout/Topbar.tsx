"use client";
import { useState } from "react";
import { Bell, Sun, Moon, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useAchievements";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? "http://localhost/pb";

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function Topbar({ title }: { title?: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { count, notifications, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const avatarUrl = user?.avatar
    ? `${PB_URL}/api/files/users/${user.id}/${user.avatar}?thumb=40x40`
    : undefined;

  function handleLogout() { logout(); router.push("/login"); }

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0 z-10">
      <h1 className="font-semibold text-base">{title ?? "Intranet"}</h1>

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => { setNotifOpen((v) => !v); if (count > 0) markAllRead(); }}
            className="relative">
            <Bell className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold">Notificações</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma notificação</p>
                ) : (
                  notifications.map((n) => (
                    <Link key={n.id} href={n.link ?? "#"} onClick={() => setNotifOpen(false)}
                      className="flex gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors border-b border-border/50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-base shrink-0">
                        {n.type === "achievement" ? "🏆" : "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs line-clamp-2">{n.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(n.created)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent/50 transition-colors outline-none">
            <Avatar className="w-7 h-7">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium leading-none">{user?.name ?? "Usuário"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{user?.department ?? user?.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
