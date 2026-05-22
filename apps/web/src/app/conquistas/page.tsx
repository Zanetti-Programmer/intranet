"use client";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "../layout-dashboard";

export default function Page() {
  const pathname = usePathname();
  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-3xl mx-auto px-5 py-6">
        <p className="text-muted-foreground">Em construção...</p>
      </div>
    </DashboardLayout>
  );
}
