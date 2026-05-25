import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pb_auth";
// Buffer em segundos — redireciona antes do token expirar de fato
const EXPIRY_BUFFER = 60;

// Decodifica o payload JWT (sem verificação de assinatura — apenas para checar exp)
function getJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    // Normaliza base64url → base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(b64);
    const json = JSON.parse(decoded) as { exp?: number };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const exp = getJwtExp(token);
  if (!exp) return false;
  return exp > Math.floor(Date.now() / 1000) + EXPIRY_BUFFER;
}

// Rotas que não precisam de autenticação
const PUBLIC_PREFIXES = ["/login", "/_next", "/api", "/pb", "/favicon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  const token = cookie?.value ? decodeURIComponent(cookie.value) : null;

  if (!token || !isTokenValid(token)) {
    const loginUrl = new URL("/login", request.url);
    // Preserva a URL de destino para redirect pós-login
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Processa todas as rotas exceto arquivos estáticos e imagens otimizadas
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
