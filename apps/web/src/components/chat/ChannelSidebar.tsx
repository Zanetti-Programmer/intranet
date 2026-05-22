"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hash, Plus, MessageSquarePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { NewDMModal } from "./NewDMModal";
import type { UseChannelsResult, DMChannel } from "@/lib/hooks/useChannels";

interface Props extends UseChannelsResult {
  activeChannelId?: string;
}

export function ChannelSidebar({
  channels, dmChannels, loading, joinChannel, createDM, allUsers, activeChannelId,
}: Props) {
  const router = useRouter();
  const [showDMModal, setShowDMModal] = useState(false);
  const [creatingDM, setCreatingDM] = useState(false);

  async function handleDMSelect(userId: string) {
    setShowDMModal(false);
    setCreatingDM(true);
    try {
      const channelId = await createDM(userId);
      router.push(`/chat/${channelId}`);
    } finally {
      setCreatingDM(false);
    }
  }

  function navChannel(ch: Channel) {
    router.push(`/chat/${ch.id}`);
  }

  return (
    <div className="w-56 shrink-0 flex flex-col h-full bg-muted/30 border-r border-border overflow-hidden">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="font-semibold text-sm">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {/* Channels */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Canais
            </span>
          </div>
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-1">Nenhum canal</p>
          ) : (
            channels.map((ch) => (
              <ChannelItem key={ch.id} channel={ch} active={ch.id === activeChannelId}
                onClick={() => navChannel(ch)} />
            ))
          )}
        </div>

        {/* DMs */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Mensagens
            </span>
            <button onClick={() => setShowDMModal(true)} disabled={creatingDM}
              className="text-muted-foreground hover:text-foreground transition-colors">
              {creatingDM
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <MessageSquarePlus className="w-3.5 h-3.5" />}
            </button>
          </div>
          {dmChannels.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-1">Nenhuma conversa</p>
          ) : (
            dmChannels.map((ch) => (
              <DMItem key={ch.id} channel={ch} active={ch.id === activeChannelId}
                onClick={() => navChannel(ch)} />
            ))
          )}
        </div>
      </div>

      {showDMModal && (
        <NewDMModal users={allUsers} onSelect={handleDMSelect} onClose={() => setShowDMModal(false)} />
      )}
    </div>
  );
}

function ChannelItem({ channel, active, onClick }: { channel: Channel; active: boolean; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded-none",
        active
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Hash className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{channel.name}</span>
    </motion.button>
  );
}

function DMItem({ channel, active, onClick }: { channel: DMChannel; active: boolean; onClick: () => void }) {
  const other = channel.otherUser;
  return (
    <motion.button whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {other ? (
        <UserAvatar user={other} size="sm" className="w-5 h-5" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-muted-foreground/20 shrink-0" />
      )}
      <span className="truncate">{other?.name ?? "DM"}</span>
    </motion.button>
  );
}
