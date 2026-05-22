"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { Channel, ChannelMember, User } from "@/types";

export interface DMChannel extends Channel {
  otherUser?: User;
}

export interface UseChannelsResult {
  channels: Channel[];
  dmChannels: DMChannel[];
  loading: boolean;
  joinChannel: (channelId: string) => Promise<void>;
  createDM: (targetUserId: string) => Promise<string>;
  allUsers: User[];
}

export function useChannels(): UseChannelsResult {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dmChannels, setDmChannels] = useState<DMChannel[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const pb = getPocketBase();
    const userId = pb.authStore.record?.id;
    if (!userId) return;

    try {
      // Get all memberships for current user, expanding the channel
      const memberships = await pb.collection("channel_members").getFullList({
        filter: `user = "${userId}"`,
        expand: "channel",
      }) as unknown as ChannelMember[];

      const allChannels = memberships
        .map((m) => m.expand?.channel)
        .filter((c): c is Channel => !!c);

      const regularChannels = allChannels.filter((c) => c.type === "channel");
      setChannels(regularChannels);

      // For DM channels, fetch the other user
      const dmList = allChannels.filter((c) => c.type === "dm");
      if (dmList.length > 0) {
        const dmIds = dmList.map((c) => `"${c.id}"`).join(",");
        const otherMembers = await pb.collection("channel_members").getFullList({
          filter: `channel IN (${dmIds}) && user != "${userId}"`,
          expand: "user",
        }) as unknown as ChannelMember[];

        const otherUserMap = new Map(
          otherMembers.map((m) => [m.channel, m.expand?.user])
        );

        setDmChannels(dmList.map((c) => ({
          ...c,
          otherUser: otherUserMap.get(c.id),
        })));
      } else {
        setDmChannels([]);
      }

      // Load all users for DM creation
      const users = await pb.collection("users").getFullList({ sort: "name" });
      setAllUsers(users as unknown as User[]);
    } catch {
      // PocketBase not ready yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const joinChannel = useCallback(async (channelId: string) => {
    const pb = getPocketBase();
    const userId = pb.authStore.record?.id;
    if (!userId) return;
    try {
      await pb.collection("channel_members").create({ channel: channelId, user: userId });
      await load();
    } catch { /* already a member */ }
  }, [load]);

  const createDM = useCallback(async (targetUserId: string): Promise<string> => {
    const pb = getPocketBase();
    const myId = pb.authStore.record?.id;
    if (!myId) throw new Error("Not authenticated");

    // Check if DM already exists between these two users
    try {
      const myDMMembers = await pb.collection("channel_members").getFullList({
        filter: `user = "${myId}" && channel.type = "dm"`,
        fields: "channel",
      }) as unknown as ChannelMember[];

      if (myDMMembers.length > 0) {
        const dmIds = myDMMembers.map((m) => `"${m.channel}"`).join(",");
        const existing = await pb.collection("channel_members").getFirstListItem(
          `channel IN (${dmIds}) && user = "${targetUserId}"`
        ) as unknown as ChannelMember;
        return existing.channel; // return existing DM channel ID
      }
    } catch { /* no existing DM */ }

    // Create new DM channel
    const channel = await pb.collection("channels").create({
      name: "dm",
      type: "dm",
      created_by: myId,
    }) as unknown as Channel;

    // Add both members
    await pb.collection("channel_members").create({ channel: channel.id, user: myId });
    await pb.collection("channel_members").create({ channel: channel.id, user: targetUserId });

    await load();
    return channel.id;
  }, [load]);

  return { channels, dmChannels, loading, joinChannel, createDM, allUsers };
}
