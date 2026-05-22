import PocketBase from "pocketbase";

function getPBUrl(): string {
  // Env var tem prioridade (setada no build ou runtime)
  if (process.env.NEXT_PUBLIC_PB_URL) return process.env.NEXT_PUBLIC_PB_URL;
  // No browser: usa a mesma origem do app + /pb (funciona atrás de qualquer proxy)
  if (typeof window !== "undefined") return `${window.location.origin}/pb`;
  // SSR fallback
  return "http://localhost/pb";
}

let pb: PocketBase;

export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase(getPBUrl());
    pb.autoCancellation(false);
  }
  return pb;
}

export default getPocketBase;
