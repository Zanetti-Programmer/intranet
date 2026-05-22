"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { cn } from "@/lib/utils";

const TABS = ["NOVOS", "ATIVOS", "POPULARES"];

function SpacesWidgetInner() {
  const { spaces, loading } = useSpaces();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams?.get("space") ?? "";
  const [tab, setTab] = useState("NOVOS");

  function handleClick(id: string) {
    const p = new URLSearchParams(searchParams?.toString());
    if (active === id) p.delete("space"); else p.set("space", id);
    router.push(`/?${p.toString()}`);
  }

  if (loading || spaces.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Espaços</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pb-3 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors",
              tab === t
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}>
            {t}
          </button>
        ))}
      </div>

      <div className="border-t border-border/60" />

      <div className="divide-y divide-border/50">
        {spaces.map((space, i) => (
          <button key={space.id} onClick={() => handleClick(space.id)}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left",
              active === space.id && "bg-primary/5"
            )}
          >
            {/* Square avatar with emoji */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${space.color}25`, border: `1px solid ${space.color}30` }}>
              {space.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold", active === space.id && "text-primary")}>
                {space.name}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60 mt-0.5">
                ATIVO {i === 0 ? "HOJE" : i < 3 ? `${i + 1} DIAS ATRÁS` : "RECENTEMENTE"}
              </p>
            </div>
            <button className="text-muted-foreground/40 hover:text-muted-foreground text-sm px-1">···</button>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SpacesWidget() {
  return (
    <Suspense fallback={null}>
      <SpacesWidgetInner />
    </Suspense>
  );
}
