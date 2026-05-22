"use client";
import { useRouter } from "next/navigation";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useChannels } from "@/lib/hooks/useChannels";
import { useMessages, useTyping } from "@/lib/hooks/useMessages";
import { Hash, MessageSquare } from "lucide-react";
import type { Channel } from "@/types";
import type { DMChannel } from "@/lib/hooks/useChannels";

interface Props {
  activeChannelId: string | null;
}

function getChannelName(
  channelId: string | null,
  channels: Channel[],
  dmChannels: DMChannel[]
) {
  if (!channelId) return null;
  const ch = channels.find((c) => c.id === channelId);
  if (ch) return { name: ch.name, isDM: false };
  const dm = dmChannels.find((c) => c.id === channelId);
  if (dm) return { name: dm.otherUser?.name ?? "DM", isDM: true };
  return null;
}

export function ChatShell({ activeChannelId }: Props) {
  const router = useRouter();
  const channelsState = useChannels();
  const { channels, dmChannels, loading } = channelsState;
  const { messages, loading: messagesLoading, sendMessage, deleteMessage, loadMore, hasMore } =
    useMessages(activeChannelId);
  const { typingUsers, notifyTyping, stopTyping } = useTyping(activeChannelId);

  const channelInfo = getChannelName(activeChannelId, channels, dmChannels);

  // Auto-navigate to first channel if none selected and not loading
  if (!activeChannelId && !loading && channels.length > 0) {
    router.replace(`/chat/${channels[0].id}`);
  }

  return (
    <div className="flex h-full">
      <ChannelSidebar {...channelsState} activeChannelId={activeChannelId ?? undefined} />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Channel header */}
        <div className="h-12 border-b border-border flex items-center gap-2 px-4 shrink-0 bg-background/80 backdrop-blur-sm">
          {channelInfo ? (
            <>
              {channelInfo.isDM
                ? <MessageSquare className="w-4 h-4 text-muted-foreground" />
                : <Hash className="w-4 h-4 text-muted-foreground" />}
              <span className="font-semibold text-sm">{channelInfo.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Selecione um canal</span>
          )}
        </div>

        {activeChannelId ? (
          <>
            <MessageList
              messages={messages}
              loading={messagesLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onDelete={deleteMessage}
              typingUsers={typingUsers}
            />
            <MessageInput
              onSend={sendMessage}
              onTyping={notifyTyping}
              onStopTyping={stopTyping}
              placeholder={channelInfo ? `Mensagem em ${channelInfo.isDM ? "" : "#"}${channelInfo.name}` : "Mensagem..."}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary/60" />
            </div>
            <p className="font-semibold">Bem-vindo ao Chat</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Selecione um canal à esquerda ou inicie uma conversa privada com alguém
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
