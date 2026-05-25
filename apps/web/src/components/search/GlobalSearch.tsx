"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Users, FileText, BookMarked, Ticket, BookOpen, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import getPocketBase from "@/lib/pocketbase";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { User } from "@/types";

interface SearchResult {
  id: string;
  type: "user" | "wiki" | "document" | "article" | "announcement" | "ticket";
  title: string;
  subtitle?: string;
  href: string;
  user?: User;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  user:         { icon: Users,      label: "Pessoas",       color: "text-blue-400" },
  wiki:         { icon: BookMarked, label: "Wiki",          color: "text-purple-400" },
  document:     { icon: FileText,   label: "Documentos",    color: "text-red-400" },
  article:      { icon: BookOpen,   label: "Blog/Notícias", color: "text-emerald-400" },
  announcement: { icon: Megaphone,  label: "Avisos",        color: "text-amber-400" },
  ticket:       { icon: Ticket,     label: "Chamados",      color: "text-orange-400" },
};

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    const pb = getPocketBase();
    setLoading(true);
    try {
      const f = q.replace(/"/g, "");
      const [users, wikis, docs, articles, announcements, tickets] = await Promise.allSettled([
        pb.collection("users").getList(1, 5, { filter: `name ~ "${f}" || email ~ "${f}"` }),
        pb.collection("wiki_articles").getList(1, 5, { filter: `title ~ "${f}"` }),
        pb.collection("documents").getList(1, 5, { filter: `title ~ "${f}"` }),
        pb.collection("articles").getList(1, 5, { filter: `title ~ "${f}" && status = "published"` }),
        pb.collection("announcements").getList(1, 5, { filter: `title ~ "${f}"` }),
        pb.collection("tickets").getList(1, 5, { filter: `title ~ "${f}"` }),
      ]);

      const out: SearchResult[] = [];
      if (users.status === "fulfilled") {
        users.value.items.forEach((u: any) => out.push({
          id: u.id, type: "user", title: u.name,
          subtitle: u.department || u.email, href: "/pessoas", user: u,
        }));
      }
      if (wikis.status === "fulfilled") {
        wikis.value.items.forEach((a: any) => out.push({
          id: a.id, type: "wiki", title: a.title, subtitle: a.category, href: "/wiki",
        }));
      }
      if (docs.status === "fulfilled") {
        docs.value.items.forEach((d: any) => out.push({
          id: d.id, type: "document", title: d.title, subtitle: d.category, href: "/documentos",
        }));
      }
      if (articles.status === "fulfilled") {
        articles.value.items.forEach((a: any) => out.push({
          id: a.id, type: "article", title: a.title,
          href: a.type === "blog" ? "/blog" : "/noticias",
        }));
      }
      if (announcements.status === "fulfilled") {
        announcements.value.items.forEach((a: any) => out.push({
          id: a.id, type: "announcement", title: a.title, href: "/avisos",
        }));
      }
      if (tickets.status === "fulfilled") {
        tickets.value.items.forEach((t: any) => out.push({
          id: t.id, type: "ticket", title: t.title,
          subtitle: t.status, href: `/chamados/${t.id}`,
        }));
      }
      setResults(out);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          onClick={onClose}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.8} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar pessoas, wiki, documentos, chamados..."
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
              <kbd className="hidden sm:flex text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {loading && query.length >= 2 && (
                <p className="text-xs text-muted-foreground text-center py-6">Buscando...</p>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhum resultado para &ldquo;{query}&rdquo;
                </p>
              )}
              {!query && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Comece a digitar para buscar em toda a intranet
                </p>
              )}
              {Object.entries(grouped).map(([type, items]) => {
                const config = TYPE_CONFIG[type];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                      <Icon style={{ width: 12, height: 12 }} className={config.color} />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {config.label}
                      </span>
                    </div>
                    {items.map((r) => (
                      <button key={r.id} onClick={() => navigate(r.href)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                        {r.user ? (
                          <UserAvatar user={r.user} size="sm" />
                        ) : (
                          <div className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center ${config.color}`}>
                            <Icon style={{ width: 13, height: 13 }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          {r.subtitle && (
                            <p className="text-xs text-muted-foreground truncate capitalize">{r.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
              {Object.keys(grouped).length > 0 && (
                <div className="h-3" />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
