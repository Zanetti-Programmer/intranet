"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpacesWidget() {
  const { spaces, loading } = useSpaces();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams?.get("space") ?? "";

  function handleClick(id: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (active === id) params.delete("space");
    else params.set("space", id);
    router.push(`/?${params.toString()}`);
  }

  if (loading || spaces.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Espaços</h3>
      </div>
      <div className="p-2 space-y-0.5">
        {spaces.map((space) => (
          <button
            key={space.id}
            onClick={() => handleClick(space.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left",
              active === space.id
                ? "bg-primary/15 text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="text-base leading-none">{space.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{space.name}</p>
              {space.description && (
                <p className="text-[10px] text-muted-foreground/70 truncate">{space.description}</p>
              )}
            </div>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: space.color }} />
          </button>
        ))}
      </div>
    </div>
  );
}
