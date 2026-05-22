"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import getPocketBase from "@/lib/pocketbase";

interface Props {
  users: User[];
  onSelect: (userId: string) => void;
  onClose: () => void;
}

export function NewDMModal({ users, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const myId = getPocketBase().authStore.record?.id;

  const filtered = users
    .filter((u) => u.id !== myId)
    .filter((u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.department?.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <AnimatePresence>
      <motion.div
        key="dm-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Nova conversa</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar pessoas..."
                className="pl-9 h-9 text-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto pb-2">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">Nenhuma pessoa encontrada</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelect(u.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  <UserAvatar user={u} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    {u.department && (
                      <p className="text-[11px] text-muted-foreground">{u.department}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
