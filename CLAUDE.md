# Contexto do Projeto — Intranet Corporativa

## O que é este projeto

Intranet corporativa completa com visual de rede social, desenvolvida com **Next.js 15** no frontend e **PocketBase** como backend (auth + banco SQLite + realtime + storage de arquivos). Tudo orquestrado via Docker Compose com nginx como proxy reverso.

> **Este projeto foi completamente reescrito.** O CLAUDE.md anterior descrevia uma versão baseada em HumHub + GLPI que foi abandonada. A versão atual é 100% customizada.

---

## Arquitetura atual

```
Internet / Rede local
        │
   nginx :80
   ┌─────┴──────────┐
   │                │
Next.js :3000   PocketBase :8090
                    │
               SQLite (pb_data volume)
```

| Serviço | Imagem | Porta interna | Porta externa |
|---|---|---|---|
| nginx (proxy) | nginx:alpine | 80 | 80 |
| Next.js (frontend) | build local | 3000 | via nginx `/` |
| PocketBase (backend) | build local | 8090 | via nginx `/pb` |

---

## Stack técnica

- **Frontend:** Next.js 15+ App Router, React, Tailwind CSS, Framer Motion, Lucide React v1.16.0, shadcn/ui
- **Backend:** PocketBase (Go) — auth JWT, SQLite, realtime subscriptions via SSE, file storage
- **Infra:** Docker Compose, nginx reverse proxy
- **Padrão de componentes:** `"use client"` + `export const dynamic = "force-dynamic"` em todas as páginas

---

## Estrutura do projeto

```
intranet/
├── docker-compose.yml
├── .env / .env.example
├── nginx/nginx.conf
├── pocketbase/Dockerfile
└── apps/web/                        ← Next.js app
    ├── src/
    │   ├── app/                     ← 27 rotas (App Router)
    │   │   ├── page.tsx             ← Feed (home)
    │   │   ├── login/
    │   │   ├── admin/
    │   │   ├── noticias/            ← articles (type=news)
    │   │   ├── blog/                ← articles (type=blog)
    │   │   ├── mural/               ← wall_cards
    │   │   ├── pesquisas/           ← polls + poll_votes
    │   │   ├── treinamentos/        ← trainings + training_completions
    │   │   ├── tarefas/             ← tasks (kanban)
    │   │   ├── grupos/              ← spaces
    │   │   ├── relatorios/          ← leitura de collections (admin/rh)
    │   │   ├── chat/                ← channels + messages
    │   │   ├── chamados/            ← tickets
    │   │   ├── wiki/                ← wiki_articles
    │   │   ├── galeria/             ← gallery_albums + gallery_photos
    │   │   ├── vagas/               ← job_postings + job_applications
    │   │   ├── classificados/       ← marketplace_items
    │   │   ├── beneficios/          ← benefits
    │   │   ├── conquistas/          ← achievements
    │   │   ├── aniversariantes/     ← users (birthday filter)
    │   │   ├── organograma/         ← users (hierarquia)
    │   │   ├── documentos/          ← documents
    │   │   ├── links/               ← useful_links
    │   │   ├── pessoas/             ← users
    │   │   ├── perfil/              ← users (próprio perfil)
    │   │   ├── avisos/              ← announcements
    │   │   └── calendario/          ← events
    │   ├── components/
    │   │   ├── layout/              ← Sidebar, Topbar
    │   │   ├── shared/              ← UserAvatar, ComingSoonPage
    │   │   └── ui/                  ← shadcn/ui (Button, Input, etc.)
    │   ├── lib/
    │   │   ├── hooks/               ← um hook por domínio (useArticles, useMural, etc.)
    │   │   ├── pocketbase.ts        ← singleton getPocketBase()
    │   │   └── utils.ts             ← cn(), pbFileUrl()
    │   └── types/index.ts           ← todas as interfaces TypeScript
    └── Dockerfile
```

---

## Convenções de código

### Padrão de página

```tsx
"use client";
export const dynamic = "force-dynamic";

import { DashboardLayout } from "../layout-dashboard";
import { useXxx } from "@/lib/hooks/useXxx";

export default function XxxPage() {
  const pathname = usePathname();
  return (
    <DashboardLayout pathname={pathname}>
      {/* conteúdo */}
    </DashboardLayout>
  );
}
```

### Padrão de hook

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import getPocketBase from "@/lib/pocketbase";

export function useXxx() {
  const [items, setItems] = useState([]);
  const fetchAll = useCallback(async () => { /* ... */ }, []);
  useEffect(() => {
    fetchAll();
    const pb = getPocketBase();
    pb.collection("xxx").subscribe("*", () => fetchAll()).catch(() => {});
    return () => { pb.collection("xxx").unsubscribe("*").catch(() => {}); };
  }, [fetchAll]);
  return { items, /* CRUD functions */ };
}
```

### Utilitários

- `getPocketBase()` — singleton do client PocketBase
- `pbFileUrl(collection, id, filename, size?)` — URL de arquivo com thumb
- `cn(...classes)` — clsx/tailwind merge
- `toast.success/error` — feedback via sonner

### Permissões de papel (role)

| role | Permissões extras |
|---|---|
| `admin` | tudo |
| `rh` | criar notícias, blog, avisos, enquetes, vagas, benefícios, ver relatórios |
| `ti` | criar blog, treinamentos, chamados |
| `user` | leitura geral + posts + mural + tarefas pessoais |

---

## Como subir o ambiente

```bash
cp .env.example .env
# editar .env com as credenciais
docker compose up -d
```

### Variáveis essenciais

```env
PB_ADMIN_EMAIL=admin@empresa.com
PB_ADMIN_PASSWORD=SenhaForte@2024
NEXT_PUBLIC_PB_URL=http://localhost/pb
HTTP_PORT=80
```

### Painel admin do PocketBase

Disponível em `http://localhost/pb/_/` após subir.

---

## Rebuild do frontend

```bash
docker compose up -d --build web
```

---

## Collections PocketBase (principais)

| Collection | Usado em |
|---|---|
| `users` | perfil, pessoas, organograma, aniversariantes |
| `posts` | feed (home) |
| `spaces` | grupos, feed filtrado |
| `articles` | /noticias (type=news) e /blog (type=blog) |
| `wall_cards` | /mural |
| `polls` + `poll_votes` | /pesquisas |
| `trainings` + `training_completions` | /treinamentos |
| `tasks` | /tarefas |
| `tickets` + `ticket_comments` | /chamados |
| `channels` + `messages` | /chat |
| `wiki_articles` | /wiki |
| `gallery_albums` + `gallery_photos` | /galeria |
| `job_postings` + `job_applications` | /vagas |
| `marketplace_items` | /classificados |
| `benefits` | /beneficios |
| `achievements` | /conquistas |
| `announcements` | /avisos |
| `events` | /calendario |
| `documents` | /documentos |
| `useful_links` | /links |
