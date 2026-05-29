# Contexto do Projeto — Intranet Corporativa

## O que é este projeto

Intranet corporativa completa com visual de rede social, desenvolvida com **Next.js 16** no frontend e **PocketBase** como backend (auth + banco SQLite + realtime + storage de arquivos). Tudo orquestrado via Docker Compose com nginx como proxy reverso.

---

## Arquitetura atual

```
Internet / Rede local
        │
   nginx :80 / :443
   ┌─────┴──────────┐
   │                │
Next.js :3000   PocketBase :8090
                    │
               SQLite (pb_data volume)
```

| Serviço | Imagem | Porta interna | Porta externa |
|---|---|---|---|
| nginx (proxy) | nginx:alpine | 80/443 | 80/443 |
| Next.js (frontend) | build local | 3000 | via nginx `/` |
| PocketBase (backend) | build local | 8090 | via nginx `/pb` |
| backup | alpine:3.19 | — | — (cron interno, volume pb_backups) |

---

## Stack técnica

- **Frontend:** Next.js 16 App Router, React, Tailwind CSS, Framer Motion, Lucide React v1.16.0, shadcn/ui
- **Editor rich text:** Tiptap ^2 + DOMPurify ^3 (blog, notícias, wiki)
- **Backend:** PocketBase 0.22.30 (Go) — auth JWT, SQLite, realtime SSE, file storage
- **Infra:** Docker Compose, nginx (gzip + headers de segurança + rate limiting)
- **Padrão de componentes:** `"use client"` + `export const dynamic = "force-dynamic"` em todas as páginas

---

## Estrutura do projeto

```
intranet/
├── docker-compose.yml
├── .env / .env.example
├── nginx/nginx.conf
├── scripts/
│   ├── backup.sh               ← backup diário às 2h via PocketBase API
│   └── seed-demo.js            ← dados de demonstração
├── pocketbase/
│   ├── Dockerfile
│   └── pb_hooks/
│       ├── bootstrap.pb.js     ← cria todas as collections + regras no primeiro boot
│       ├── email_hooks.pb.js   ← e-mails automáticos (chamados, tarefas, avisos, conquistas)
│       └── security_hooks.pb.js← validações e regras de segurança adicionais
└── apps/web/                        ← Next.js 16 app
    ├── public/
    │   ├── manifest.json        ← PWA manifest
    │   ├── sw.js                ← Service Worker (cache-first assets, network-first /pb/)
    │   └── icons/               ← ícones PWA (192px, 512px)
    ├── src/
    │   ├── app/                 ← 34 rotas (App Router)
    │   │   ├── page.tsx         ← Feed (home)
    │   │   ├── login/
    │   │   ├── admin/
    │   │   ├── noticias/        ← articles (type=news) + [id]/
    │   │   ├── blog/            ← articles (type=blog) + [id]/ + useBlogLike.ts
    │   │   ├── mural/           ← wall_cards
    │   │   ├── pesquisas/       ← polls + poll_votes
    │   │   ├── treinamentos/    ← trainings + training_completions
    │   │   ├── tarefas/         ← tasks (kanban)
    │   │   ├── grupos/          ← spaces
    │   │   ├── relatorios/      ← leitura de collections (admin/rh)
    │   │   ├── chat/            ← channels + messages + [channelId]/
    │   │   ├── chamados/        ← tickets + [id]/
    │   │   ├── wiki/            ← wiki_articles + [id]/
    │   │   ├── galeria/         ← gallery_albums + gallery_photos
    │   │   ├── vagas/           ← job_postings + job_applications + [id]/
    │   │   ├── classificados/   ← marketplace_items + [id]/ (detalhe + galeria)
    │   │   ├── beneficios/      ← benefits
    │   │   ├── conquistas/      ← achievements
    │   │   ├── aniversariantes/ ← users (birthday filter)
    │   │   ├── organograma/     ← users (hierarquia em árvore)
    │   │   ├── documentos/      ← documents (preview PDF inline)
    │   │   ├── links/           ← useful_links
    │   │   ├── pessoas/         ← users
    │   │   ├── perfil/          ← users (próprio perfil)
    │   │   ├── avisos/          ← announcements
    │   │   └── calendario/      ← events
    │   ├── components/
    │   │   ├── layout/          ← Sidebar, Topbar (Cmd+K busca, seletor de idioma)
    │   │   ├── feed/            ← PostCard, CommentSection, FromTheBlogCard, GlobalSearch
    │   │   ├── search/          ← GlobalSearch.tsx (modal Cmd+K)
    │   │   ├── shared/          ← UserAvatar, ComingSoonPage
    │   │   └── ui/              ← shadcn/ui + RichTextEditor + RichTextContent
    │   ├── lib/
    │   │   ├── hooks/           ← um hook por domínio (~20 hooks)
    │   │   ├── pocketbase.ts    ← singleton getPocketBase()
    │   │   └── utils.ts         ← cn(), pbFileUrl(), formatDistanceToNow()
    │   └── types/index.ts       ← todas as interfaces TypeScript
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

### Rich Text

- `<RichTextEditor value onChange placeholder minHeight />` — editor Tiptap, usar em formulários
- `<RichTextContent html className />` — renderiza HTML sanitizado (DOMPurify), usar em leitura
- Conteúdo plain-text existente renderiza corretamente (texto sem tags é HTML válido)

### Permissões de papel (role)

| role | Permissões extras |
|---|---|
| `admin` | tudo |
| `rh` | criar notícias, blog, avisos, enquetes, vagas, benefícios, ver relatórios |
| `ti` | criar blog, treinamentos, wiki; recebe e-mail de novos chamados |
| `user` | leitura geral + posts + mural + tarefas pessoais |

---

## Como subir o ambiente

```bash
cp .env.example .env
# editar .env com as credenciais
docker compose up -d
```

O `bootstrap.pb.js` cria automaticamente todas as collections, campos e regras de acesso no primeiro boot do PocketBase.

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

| Collection | Campos notáveis | Usado em |
|---|---|---|
| `users` | name, email, role, avatar, department, manager | perfil, pessoas, organograma, aniversariantes |
| `posts` | content, attachments, space, author | feed (home) |
| `post_reactions` | post, user, emoji | curtidas (PostCard, blog, noticias) |
| `post_comments` | post, user, content | comentários em posts e artigos |
| `post_stars` | post, user | favoritos no feed |
| `spaces` | name, description | grupos, feed filtrado |
| `articles` | title, content, type, status, tags, cover, author | /noticias (type=news) e /blog (type=blog) |
| `wall_cards` | content, color, author | /mural |
| `polls` + `poll_votes` | question, options / poll, option, user | /pesquisas |
| `trainings` + `training_completions` | title, content / training, user | /treinamentos |
| `tasks` | title, status, assignee, due_date | /tarefas (kanban) |
| `tickets` + `ticket_comments` | title, description, status, category / ticket, user, content | /chamados |
| `channels` + `messages` | name, type / channel, user, content | /chat |
| `wiki_articles` | title, content, tags, author | /wiki |
| `gallery_albums` + `gallery_photos` | name / album, file, caption | /galeria |
| `job_postings` + `job_applications` | title, description / job, user, resume | /vagas |
| `marketplace_items` | title, description, price, category, **condition** (novo/usado), status, photos, author | /classificados |
| `benefits` | title, description, category | /beneficios |
| `achievements` | title, description, icon, recipient, awarded_by | /conquistas |
| `announcements` | title, content, priority, author | /avisos |
| `events` | title, date, location, all_day | /calendario |
| `documents` | title, file, category, uploaded_by | /documentos |
| `useful_links` | title, url, category, icon | /links |
| `notifications` | user, type, message, read, link | notificações in-app (Topbar) |

---

## E-mail (hooks PocketBase)

Configurar SMTP em `http://localhost/pb/_/` → Settings → Mail settings.

Os hooks em `pb_hooks/email_hooks.pb.js` disparam automaticamente:

- **Chamado criado** → todos `role = "ti"`
- **Status de chamado alterado** → autor do chamado
- **Tarefa com assignee** → assignee (se diferente do criador)
- **Conquista** → usuário premiado
- **Aviso publicado** → broadcast para todos

---

## Backup automático

Container `intranet_backup` executa `scripts/backup.sh` via cron às 2h.  
Usa a API REST do PocketBase para gerar backup nativo (seguro com WAL ativo).  
Mantém os últimos 7 arquivos no volume `pb_backups`.

```bash
docker exec intranet_backup ls /backups/
```

---

## PWA

- `apps/web/public/manifest.json` — nome, cores, ícones, `display: standalone`
- `apps/web/public/sw.js` — cache-first para assets estáticos, network-first para `/pb/` e `/api/`
- Registrado automaticamente via componente `<PwaRegistration />` no `layout.tsx`
