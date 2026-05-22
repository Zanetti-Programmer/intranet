"use client";
export const dynamic = "force-dynamic";

import { usePathname, useParams } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "../../layout-dashboard";
import { ChatShell } from "../ChatShell";

export default function ChannelPage() {
  const pathname = usePathname();
  const { channelId } = useParams<{ channelId: string }>();
  return (
    <DashboardLayout pathname={pathname} fullHeight>
      <Suspense>
        <ChatShell activeChannelId={channelId} />
      </Suspense>
    </DashboardLayout>
  );
}
