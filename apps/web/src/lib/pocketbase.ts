import PocketBase from "pocketbase";

function getPBUrl(): string {
  if (process.env.NEXT_PUBLIC_PB_URL) return process.env.NEXT_PUBLIC_PB_URL;
  if (typeof window !== "undefined") return `${window.location.origin}/pb`;
  return "http://localhost/pb";
}

const COOKIE_NAME = "pb_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function syncAuthCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=${COOKIE_MAX_AGE}`;
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

let pb: PocketBase;

export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase(getPBUrl());
    pb.autoCancellation(false);
    // Sync token to cookie so Edge Middleware can validate routes without a PocketBase call
    pb.authStore.onChange((token) => syncAuthCookie(token), true);
  }
  return pb;
}

export default getPocketBase;
