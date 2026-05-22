"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";
import type { User } from "@/types";

export interface GalleryAlbum {
  id: string;
  name: string;
  description?: string;
  event_name?: string;
  cover?: string;
  author: string;
  space?: string;
  created: string;
  expand?: { author: User };
}

export interface GalleryPhoto {
  id: string;
  album: string;
  file: string;
  caption?: string;
  author: string;
  created: string;
  expand?: { author: User };
}

export function useGallery() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlbums = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) return;
    try {
      const items = await pb.collection("gallery_albums").getFullList({
        sort: "-created", expand: "author",
      });
      setAlbums(items as unknown as GalleryAlbum[]);
    } catch { setAlbums([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const createAlbum = useCallback(async (name: string, eventName?: string, description?: string) => {
    const pb = getPocketBase();
    const r = await pb.collection("gallery_albums").create({
      name, event_name: eventName, description, author: pb.authStore.record!.id,
    });
    await fetchAlbums();
    return r.id;
  }, [fetchAlbums]);

  return { albums, loading, fetchAlbums, createAlbum };
}

export function useAlbumPhotos(albumId: string | null) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!albumId) return;
    const pb = getPocketBase();
    setLoading(true);
    pb.collection("gallery_photos").getFullList({
      filter: `album = "${albumId}"`, sort: "created", expand: "author",
    }).then((r) => setPhotos(r as unknown as GalleryPhoto[]))
      .catch(() => {}).finally(() => setLoading(false));
  }, [albumId]);

  const uploadPhotos = useCallback(async (albumId: string, files: File[]) => {
    const pb = getPocketBase();
    const uploaded: GalleryPhoto[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("album", albumId);
      formData.append("file", file);
      formData.append("author", pb.authStore.record!.id);
      const r = await pb.collection("gallery_photos").create(formData, { expand: "author" });
      uploaded.push(r as unknown as GalleryPhoto);
    }
    setPhotos((p) => [...p, ...uploaded]);
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    await getPocketBase().collection("gallery_photos").delete(id);
    setPhotos((p) => p.filter((ph) => ph.id !== id));
  }, []);

  return { photos, loading, uploadPhotos, deletePhoto };
}
