"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { NewAchievementModal } from "@/components/achievements/NewAchievementModal";
import { useAchievements } from "@/lib/hooks/useAchievements";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";

export default function ConquistasPage() {
  const pathname = usePathname();
  const { achievements, loading, createAchievement } = useAchievements();
  const [showModal, setShowModal] = useState(false);
  const myRole = (getPocketBase().authStore.record as { role?: string })?.role;
  const canCreate = myRole === "admin" || myRole === "rh";

  const [users, setUsers] = useState<import("@/types").User[]>([]);
  useEffect(() => {
    getPocketBase().collection("users").getFullList({ sort: "name" })
      .then((r) => setUsers(r as unknown as import("@/types").User[]))
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout pathname={pathname}>
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Mural de Conquistas</h1>
            <p className="text-sm text-muted-foreground">Reconhecimentos e conquistas da equipe</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Dar reconhecimento
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : achievements.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-2">
            <p className="text-4xl">🏆</p>
            <p className="font-medium">Nenhuma conquista ainda</p>
            {canCreate && <p className="text-sm text-muted-foreground">Seja o primeiro a reconhecer alguém da equipe!</p>}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <AchievementCard achievement={a} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <NewAchievementModal
            users={users}
            onSubmit={async (data) => { await createAchievement(data); setShowModal(false); }}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
