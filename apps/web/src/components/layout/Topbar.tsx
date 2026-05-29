"use client";
import { useState, useEffect } from "react";
import {
  Search, MessageCircle, Bell, ChevronDown,
  LogOut, User as UserIcon, Sun, Moon, Globe,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useAchievements";
import { GlobalSearch } from "@/components/search/GlobalSearch";
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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const avatarUrl = user?.avatar
    ? `${getPBBaseUrl()}/api/files/users/${user.id}/${user.avatar}?thumb=40x40`
    : undefined;

  return (
    <header
      className="flex items-center h-[56px] border-b border-border bg-background shrink-0 z-20"
      style={{ paddingLeft: 0, paddingRight: 0 }}
    >
      {/* ── Search bar (opens modal) ─────────── */}
      <button onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 flex-1 px-4 max-w-sm text-left hover:bg-muted/40 rounded-lg mx-1 py-1.5 transition-colors">
        <Search className="w-4 h-4 text-muted-foreground/50 shrink-0" strokeWidth={1.8} />
        <span className="flex-1 text-sm text-muted-foreground/45">Start typing to search...</span>
        <kbd className="hidden md:flex text-[10px] text-muted-foreground/40 bg-muted px-1.5 py-0.5 rounded border border-border/50">⌘K</kbd>
      </button>

      {/* ── Right side ──────────────────────── */}
      <div className="flex items-center gap-0.5 px-3 ml-auto">

        {/* Language selector (estático, só visual) */}
        <button className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Globe className="w-4 h-4" strokeWidth={1.8} />
          <span className="font-medium">Português</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Theme */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {theme === "dark"
            ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} />
            : <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />}
        </button>

        {/* Chat icon — igual Alliance */}
        <Link href="/chat" prefetch={false}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </Link>

        {/* Bell icon */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); if (count > 0) markAllRead(); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute top-1.5 right-1.5 w-[14px] h-[14px] rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
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
                  <Link key={n.id} href={n.link ?? "#"} prefetch={false} onClick={() => setNotifOpen(false)}
                    className="flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs shrink-0">
                      {({ achievement:"🏆", ticket_created:"🎫", task_assigned:"✅", announcement:"📢" } as Record<string,string>)[n.type] ?? "🔔"}
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

        {/* Separator vertical */}
        <div className="w-px h-5 bg-border mx-1.5" />

        {/* User — "Hi, Nome ˅" exato do Alliance */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="hidden sm:flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">Hi,</span>
              <span className="text-xs font-semibold">{user?.name?.split(" ")[0] ?? "Usuário"}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl">
            <DropdownMenuItem onClick={() => router.push("/perfil")}>
              <UserIcon className="w-3.5 h-3.5 mr-2" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { logout(); router.push("/login"); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
