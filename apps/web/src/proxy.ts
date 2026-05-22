import { NextRequest, NextResponse } from "next/server";

// Auth é gerenciada pelo PocketBase SDK no localStorage (client-side).
// O proxy apenas passa as requisições — proteção de rotas fica no DashboardLayout.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
