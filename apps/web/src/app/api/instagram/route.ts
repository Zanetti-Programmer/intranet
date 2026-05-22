import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "INSTAGRAM_ACCESS_TOKEN não configurado" }, { status: 503 });
  }
  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url,media_type,timestamp,permalink&access_token=${token}&limit=5`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message ?? "Erro na API do Instagram" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Falha ao conectar com o Instagram" }, { status: 500 });
  }
}
