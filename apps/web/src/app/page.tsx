"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "./layout-dashboard";
import { FeedContent } from "./FeedContent";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const pathname = usePathname();
  return (
    <DashboardLayout pathname={pathname}>
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      }>
        <FeedContent />
      </Suspense>
    </DashboardLayout>
  );
}
