import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import imageCompression from "browser-image-compression"

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

/**
 * Comprime uma imagem no browser antes do upload.
 * Arquivos não-imagem são retornados sem alteração.
 * @param file    Arquivo original
 * @param maxMB   Tamanho máximo desejado em MB
 */
export async function compressImage(file: File, maxMB: number): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: maxMB,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      preserveExif: false,
    });
    return new File([compressed], file.name, { type: compressed.type });
  } catch {
    return file;
  }
}
