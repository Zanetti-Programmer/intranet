"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "./layout-dashboard";
import { FeedContent } from "./FeedContent";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const pathname = usePathname();
  return (
    <DashboardLayout pathname={pathname} fullHeight>
      <Suspense fallback={
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      }>
        <FeedContent />
      </Suspense>
    </DashboardLayout>
  );
}
