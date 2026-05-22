import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "agora";
  if (mins  < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  if (days  < 7)  return `${days}d`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

/** URL base do PocketBase — funciona no browser (qualquer host) e no SSR */
export function getPBBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_PB_URL) return process.env.NEXT_PUBLIC_PB_URL;
  if (typeof window !== "undefined") return `${window.location.origin}/pb`;
  return "http://localhost/pb";
}

export function pbFileUrl(collection: string, recordId: string, filename: string, thumb?: string) {
  const url = `${getPBBaseUrl()}/api/files/${collection}/${recordId}/${filename}`;
  return thumb ? `${url}?thumb=${thumb}` : url;
}
