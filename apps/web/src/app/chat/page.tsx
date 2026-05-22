"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "../layout-dashboard";
import { ChatShell } from "./ChatShell";

export default function ChatPage() {
  const pathname = usePathname();
  return (
    <DashboardLayout pathname={pathname} fullHeight>
      <Suspense>
        <ChatShell activeChannelId={null} />
      </Suspense>
    </DashboardLayout>
  );
}
