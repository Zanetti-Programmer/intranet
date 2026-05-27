"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import getPocketBase from "@/lib/pocketbase";

export function DashboardLayout({
  children,
  pathname,
  fullHeight = false,
}: {
  children: React.ReactNode;
  pathname: string;
  fullHeight?: boolean;
}) {
  const router = useRouter();

  // Auth check is deferred to useEffect to avoid SSR/hydration mismatch.
  // The Next.js middleware is the primary auth guard; this handles session expiry.
  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) {
      router.replace("/login");
    }
    return pb.authStore.onChange((token) => {
      if (!token) router.replace("/login");
    }, false);
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<div className="w-[52px] h-screen bg-sidebar border-r border-sidebar-border shrink-0" />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title="" />
        <main className={cn(
          "flex-1 min-h-0",
          fullHeight ? "overflow-hidden" : "overflow-y-auto"
        )}>
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
