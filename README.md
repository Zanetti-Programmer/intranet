# Intranet Corporativa

Intranet completa com visual de rede social, desenvolvida com **Next.js 16** + **PocketBase**, tudo self-hosted via Docker.

---

## Funcionalidades

| Módulo | Rota | Quem acessa |
|---|---|---|
| Feed social | `/` | Todos |
| Notícias | `/noticias` | Todos (cria: admin, rh) |
| Blog corporativo | `/blog` | Todos (cria: admin, rh, ti) |
| Mural | `/mural` | Todos (posta: todos) |
| Pesquisas / Enquetes | `/pesquisas` | Todos (cria: admin, rh) |
| Treinamentos | `/treinamentos` | Todos (cria: admin, rh, ti) |
| Tarefas (Kanban) | `/tarefas` | Todos |
| Grupos & Espaços | `/grupos` | Todos (cria: admin) |
| Chat em tempo real | `/chat` | Todos |
| Chamados de TI | `/chamados` | Todos |
| Wiki interna | `/wiki` | Todos (edita: admin, rh, ti) |
| Galeria de fotos | `/galeria` | Todos (gerencia: admin, rh) |
| Vagas internas | `/vagas` | Todos (cria: admin, rh) |
| Classificados | `/classificados` | Todos (CRUD próprio) |
| Benefícios | `/beneficios` | Todos (gerencia: admin, rh) |
| Conquistas / Badges | `/conquistas` | Todos |
| Aniversariantes | `/aniversariantes` | Todos |
| Organograma | `/organograma` | Todos |
| Documentos | `/documentos` | Todos |
| Links úteis | `/links` | Todos (gerencia: admin) |
| Pessoas | `/pessoas` | Todos |
| Perfil | `/perfil` | Próprio usuário |
| Avisos | `/avisos` | Todos (cria: admin, rh) |
| Calendário | `/calendario` | Todos (cria: admin, rh) |
| Relatórios | `/relatorios` | admin, rh |
| Admin | `/admin` | admin |

---

## Recursos implementados

- **Feed social** — posts com imagens, reações, comentários, favoritos (persistidos no banco), compartilhamento
- **Rich Text Editor** — editor Tiptap em blog, notícias e wiki (negrito, itálico, listas, links)
- **Busca Global** — modal Cmd+K / Ctrl+K buscando em usuários, documentos, artigos, avisos, chamados
- **PWA** — instalável no celular/desktop (manifest + service worker com cache-first para assets)
- **Seletor de idioma** — PT-BR, EN-US, ES (persiste em localStorage)
- **Notificações in-app** — avisos, conquistas, chamados, tarefas
- **E-mail automático** — hooks PocketBase notificam TI em chamados, assignees em tarefas, usuários em avisos
- **Backup automático** — container `backup` executa às 2h via cron, mantém últimos 7 arquivos em volume `pb_backups`
- **Classificados** — CRUD completo, campo Novo/Usado, página de detalhe com galeria de fotos
- **Preview inline de PDF** — documentos PDF abrem inline sem download
- **Organograma** — hierarquia em árvore por gerentes
- **Realtime** — subscriptions SSE em todas as coleções principais

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Next.js (App Router) | 16.2.6 |
| UI | React + Tailwind CSS + shadcn/ui | — |
| Animações | Framer Motion | — |
| Editor rich text | Tiptap | ^2 |
| Sanitização HTML | DOMPurify | ^3 |
| Backend | PocketBase (auth + SQLite + realtime + storage) | 0.22.30 |
| Infra | Docker Compose + nginx | — |

---

## Como subir

### Pré-requisitos

- Docker Desktop instalado e rodando

### 1. Configurar variáveis

```bash
cp .env.example .env
```

Editar `.env`:

```env
PB_ADMIN_EMAIL=admin@suaempresa.com
PB_ADMIN_PASSWORD=SenhaForte@2024
NEXT_PUBLIC_PB_URL=http://localhost/pb
HTTP_PORT=80
```

### 2. Subir os containers

```bash
docker compose up -d
```

Aguardar ~30 segundos no primeiro boot. O PocketBase cria todas as collections automaticamente via `bootstrap.pb.js`.

### 3. Verificar

```bash
docker compose ps
```

---

## Acesso

| Sistema | URL |
|---|---|
| **Intranet** | `http://localhost/` |
| **PocketBase Admin** | `http://localhost/pb/_/` |

---

## Arquitetura

```
Internet / Rede local
        │
   nginx :80 / :443
   ┌─────┴──────────┐
   │                │
Next.js :3000   PocketBase :8090
                    │
               SQLite (volume pb_data)
```

### Serviços Docker

| Container | Imagem | Função |
|---|---|---|
| `intranet_proxy` | nginx:alpine | Proxy reverso, gzip, headers de segurança |
| `intranet_web` | build local | Frontend Next.js |
| `intranet_pb` | build local | Backend PocketBase |
| `intranet_backup` | alpine:3.19 | Backup diário às 2h |

---

## Estrutura

```
intranet/
├── docker-compose.yml
├── .env.example
├── nginx/nginx.conf
├── scripts/
│   ├── backup.sh          ← backup diário via PocketBase API
│   └── seed-demo.js       ← dados de demonstração
├── pocketbase/
│   ├── Dockerfile
│   └── pb_hooks/
│       ├── bootstrap.pb.js     ← cria collections + regras no primeiro boot
│       ├── email_hooks.pb.js   ← e-mails automáticos (chamados, tarefas, avisos)
│       └── security_hooks.pb.js← regras de segurança adicionais
└── apps/web/                   ← App Next.js 16
    └── src/
        ├── app/                ← 34 rotas (App Router)
        ├── components/
        │   ├── layout/         ← Sidebar, Topbar (busca Cmd+K, seletor de idioma)
        │   ├── feed/           ← PostCard, CommentSection, FromTheBlogCard, GlobalSearch
        │   ├── shared/         ← UserAvatar
        │   └── ui/             ← shadcn/ui + RichTextEditor + RichTextContent
        ├── lib/
        │   ├── hooks/          ← um hook por domínio (~20 hooks)
        │   ├── pocketbase.ts
        │   └── utils.ts
        └── types/index.ts
```

---

## E-mail (configuração SMTP)

Acesse `http://localhost/pb/_/` → Settings → Mail settings e configure seu servidor SMTP.

Os hooks em `pocketbase/pb_hooks/email_hooks.pb.js` enviam automaticamente:

- Chamado criado → todos os usuários com `role = "ti"`
- Status do chamado mudou → autor do chamado
- Tarefa atribuída → assignee (se diferente do criador)
- Conquista recebida → usuário premiado
- Aviso publicado → todos os usuários

---

## Backup

O container `intranet_backup` executa `scripts/backup.sh` todo dia às 2h.  
Os arquivos ficam no volume Docker `pb_backups` e os últimos 7 são mantidos.

Para verificar:

```bash
docker exec intranet_backup ls /backups/
```

---

## Comandos úteis

```bash
# Subir
docker compose up -d

# Rebuild do frontend
docker compose up -d --build web

# Logs em tempo real
docker compose logs -f web
docker compose logs -f pocketbase

# Parar tudo
docker compose down

# Parar e remover dados (APAGA TUDO)
docker compose down -v

# Popular com dados de demonstração
node scripts/seed-demo.js
```
