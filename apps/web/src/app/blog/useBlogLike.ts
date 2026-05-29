"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import getPocketBase from "@/lib/pocketbase";

export function useBlogLike(articleId: string) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const pendingRef = useRef(false);
  const myId = getPocketBase().authStore.record?.id ?? "";

  useEffect(() => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid || !articleId) return;
    pb.collection("post_reactions")
      .getFullList({ filter: `post = "${articleId}" && emoji = "❤️"` })
      .then((r) => { setCount(r.length); setLiked(r.some((rx) => rx.user === myId)); })
      .catch(() => {});
  }, [articleId, myId]);

  const toggle = useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const pb = getPocketBase();
      if (liked) {
        const ex = await pb.collection("post_reactions")
          .getFirstListItem(`post = "${articleId}" && user = "${myId}" && emoji = "❤️"`);
        await pb.collection("post_reactions").delete(ex.id);
        setLiked(false); setCount((c) => c - 1);
      } else {
        await pb.collection("post_reactions").create({ post: articleId, user: myId, emoji: "❤️" });
        setLiked(true); setCount((c) => c + 1);
      }
    } finally { pendingRef.current = false; }
  }, [articleId, myId, liked]);

  return { liked, count, toggle };
}
