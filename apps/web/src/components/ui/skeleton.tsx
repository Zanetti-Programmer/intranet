import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/70", className)} style={style} />;
}

// ── Prebuilt layouts ──────────────────────────────────────────────────────────

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <Skeleton className="h-4 w-4 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full shrink-0" />
      <Skeleton className="h-6 w-6 rounded-full shrink-0" />
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[4, 2, 3].map((count, col) => (
        <div key={col} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 ml-auto rounded-full" />
          </div>
          <div className="bg-muted/20 rounded-xl p-2 space-y-2 min-h-[120px]">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ cols = 4, count = 8 }: { cols?: number; count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(cols, 3)} lg:grid-cols-${cols} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-3 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/30 px-4 py-2.5 flex gap-4 border-b border-border">
        {[40, 15, 15, 15, 15].map((w, i) => (
          <Skeleton key={i} className={`h-3`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex gap-4 items-center border-b border-border/50 last:border-0">
          {[40, 15, 15, 15, 15].map((w, j) => (
            <Skeleton key={j} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
