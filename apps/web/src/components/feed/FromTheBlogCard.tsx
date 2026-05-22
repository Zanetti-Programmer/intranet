"use client";
import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import getPocketBase from "@/lib/pocketbase";
import type { Post } from "@/types";
import { pbFileUrl, formatDistanceToNow } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";

export function HeroPostCard({ post }: { post: Post }) {
  const images = (post.attachments ?? []).filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const img = images[0];
  const author = post.expand?.author;

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-muted/40">
      {img ? (
        <Image src={pbFileUrl("posts", post.id, img, "800x450")} alt={post.content}
          fill className="object-cover" unoptimized />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
      )}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
          INTRANET
        </span>
        <h2 className="text-white text-xl font-bold mt-3 mb-2 leading-snug line-clamp-2">
          {post.content.slice(0, 80)}
        </h2>
        <div className="flex items-center gap-3 text-white/70 text-xs">
          <span>{formatDistanceToNow(post.created)}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> 0</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 0</span>
        </div>
      </div>
    </div>
  );
}

export function FromTheBlogCard({ posts }: { posts: Post[] }) {
  if (!posts.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold">From The Blog</h3>
      </div>
      <div className="border-t border-border/60" />

      <div className="divide-y divide-border/60">
        {posts.map((post) => {
          const author = post.expand?.author;
          const images = (post.attachments ?? []).filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
          const img = images[0];
          const excerpt = post.content.length > 90 ? post.content.slice(0, 90) + "…" : post.content;

          return (
            <div key={post.id} className="flex gap-4 px-5 py-5">
              {/* Thumbnail */}
              <div className="w-24 h-20 rounded-xl overflow-hidden bg-muted shrink-0 relative">
                {img ? (
                  <Image src={pbFileUrl("posts", post.id, img, "200x160")} alt=""
                    fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-2xl">
                    {author?.name?.charAt(0) ?? "📝"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">DIGITAL</span>
                  <span className="text-[9px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(post.created)}</span>
                </div>
                <p className="text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer leading-snug line-clamp-2">
                  {post.content.slice(0, 60)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{excerpt}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-current text-red-400" /> 0</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-400" /> 0</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/60">
        <button className="w-full flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          VIEW ALL <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">→</span>
        </button>
      </div>
    </div>
  );
}
