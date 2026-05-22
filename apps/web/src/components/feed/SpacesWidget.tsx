"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TABS = ["NEWEST", "ACTIVE", "POPULAR", "ALPHABETICAL"];

function SpacesWidgetInner() {
  const { spaces } = useSpaces();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams?.get("space") ?? "";
  const [tab, setTab] = useState("NEWEST");

  const sorted = tab === "ALPHABETICAL"
    ? [...spaces].sort((a, b) => a.name.localeCompare(b.name))
    : spaces;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">Groups</h3>
      </div>
      <div className="border-t border-border/60" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 px-5 py-3">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors",
              tab === t
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
            )}>
            {t}
          </button>
        ))}
      </div>
      <div className="border-t border-border/60" />

      <div className="divide-y divide-border/50">
        {sorted.slice(0, 4).map((space, i) => (
          <button key={space.id}
            onClick={() => {
              const p = new URLSearchParams(searchParams?.toString());
              if (active === space.id) p.delete("space"); else p.set("space", space.id);
              router.push(`/?${p.toString()}`);
            }}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
          >
            {/* Square image avatar with emoji */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: `${space.color}20` }}>
              {space.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{space.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/55 mt-0.5">
                ACTIVE {i === 0 ? "TODAY" : i === 1 ? "3 DAYS, 1 HOUR AGO" : i === 2 ? "1 MONTH AGO" : "1 MONTH, 2 WEEKS AGO"}
              </p>
            </div>
            <button className="text-muted-foreground/40 hover:text-muted-foreground text-sm">···</button>
          </button>
        ))}
      </div>

      <div className="border-t border-border/60">
        <Link href="/pessoas"
          className="w-full flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          VIEW ALL <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">→</span>
        </Link>
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
