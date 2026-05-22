"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Camera } from "lucide-react";
import Image from "next/image";

interface IGPost {
  id: string;
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
  permalink: string;
}

export function InstagramWidget() {
  const [posts, setPosts] = useState<IGPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); }
        else { setPosts(data.data ?? []); }
      })
      .catch(() => setError("Não foi possível carregar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-pink-500" />
        <h3 className="font-semibold text-sm">Instagram</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="text-center py-6 space-y-1">
          <p className="text-xs text-muted-foreground">{error}</p>
          {error.includes("não configurado") && (
            <p className="text-[10px] text-muted-foreground/60">
              Defina INSTAGRAM_ACCESS_TOKEN no .env para ativar
            </p>
          )}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma publicação</p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {posts.map((post) => {
            const imgUrl = post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
            return (
              <a key={post.id} href={post.permalink} target="_blank" rel="noreferrer"
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                {imgUrl ? (
                  <Image src={imgUrl} alt={post.caption?.slice(0, 40) ?? ""}
                    fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                {post.media_type === "VIDEO" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                      <span className="text-white text-[10px]">▶</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-1">
                  <ExternalLink className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
