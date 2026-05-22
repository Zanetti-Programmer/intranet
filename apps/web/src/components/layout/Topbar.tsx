"use client";
import { useState } from "react";
import { Menu, Search, MessageSquare, Bell, ChevronDown, Sun, Moon, LogOut, User as UserIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

  return (
    <header className="h-[56px] border-b border-border bg-background flex items-center gap-0 px-0 shrink-0 z-10">

      {/* Hamburger — separado por borda */}
      <div className="flex items-center justify-center w-[52px] h-full border-r border-border shrink-0">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Search bar */}
      <div className="flex-1 relative px-4 max-w-lg">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Start typing to search..."
          className="w-full h-9 pl-10 pr-4 rounded-xl bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:bg-muted/50 transition-all"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 px-3 ml-auto">
        {/* Theme */}
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Chat icon */}
        <Link href="/chat"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <MessageSquare className="w-4 h-4" />
        </Link>

        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); if (count > 0) markAllRead(); }}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-colors relative",
              notifOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}>
            <Bell className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-semibold">Notificações</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Sem notificações</p>
                ) : notifications.map((n) => (
                  <Link key={n.id} href={n.link ?? "#"} onClick={() => setNotifOpen(false)}
                    className="flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs shrink-0">
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

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* User — "Hi, Nome ˅" */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-muted transition-colors outline-none">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Hi,</span>
              <span className="text-xs font-semibold">{user?.name?.split(" ")[0] ?? "Usuário"}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl">
            <DropdownMenuItem onClick={() => router.push("/perfil")}>
              <UserIcon className="w-3.5 h-3.5 mr-2" /> Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); router.push("/login"); }}
              className="text-destructive focus:text-destructive">
              <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
