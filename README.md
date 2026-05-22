# Intranet Corporativa

Intranet completa com visual de rede social, desenvolvida com **Next.js 15** + **PocketBase**, tudo self-hosted via Docker.

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
| Classificados | `/classificados` | Todos |
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

## Stack

- **Frontend:** Next.js 15, React, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend:** PocketBase (auth + SQLite + realtime + file storage)
- **Infra:** Docker Compose, nginx reverse proxy

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

Aguardar ~30 segundos no primeiro boot.

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
   nginx :80
   ┌─────┴──────────┐
   │                │
Next.js :3000   PocketBase :8090
                    │
               SQLite (volume pb_data)
```

---

## Estrutura

```
intranet/
├── docker-compose.yml
├── .env.example
├── nginx/nginx.conf
├── pocketbase/          ← Dockerfile do PocketBase
└── apps/web/            ← App Next.js 15
    └── src/
        ├── app/         ← 27 rotas (App Router)
        ├── components/  ← Sidebar, Topbar, UserAvatar, shadcn/ui
        ├── lib/
        │   ├── hooks/   ← um hook por domínio
        │   ├── pocketbase.ts
        │   └── utils.ts
        └── types/index.ts
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

# Parar tudo
docker compose down

# Parar e remover dados (APAGA TUDO)
docker compose down -v
```
