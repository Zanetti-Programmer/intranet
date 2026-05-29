# apps/web — Frontend Next.js

Frontend da intranet corporativa. Veja o `README.md` e `CLAUDE.md` na raiz do projeto para contexto completo.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Requer PocketBase rodando em `http://localhost:8090` (ou via Docker Compose).

```env
NEXT_PUBLIC_PB_URL=http://localhost:8090
```

## Build de produção

```bash
npm run build
npm run start
```

Em produção, use sempre o Docker Compose da raiz — o `Dockerfile` aqui é chamado pelo `docker-compose.yml`.

## Estrutura principal

```
src/
├── app/                  ← 34 rotas (Next.js App Router)
├── components/
│   ├── layout/           ← Sidebar, Topbar
│   ├── feed/             ← PostCard, CommentSection, FromTheBlogCard
│   ├── search/           ← GlobalSearch (modal Cmd+K)
│   ├── shared/           ← UserAvatar
│   └── ui/               ← shadcn/ui + RichTextEditor + RichTextContent
├── lib/
│   ├── hooks/            ← um hook por domínio de negócio
│   ├── pocketbase.ts     ← singleton getPocketBase()
│   └── utils.ts          ← cn(), pbFileUrl(), formatDistanceToNow()
└── types/index.ts        ← interfaces TypeScript
```

## Dependências principais

| Pacote | Uso |
|---|---|
| `next` 16 | framework |
| `@tiptap/react` ^2 | editor rich text (blog, notícias, wiki) |
| `dompurify` ^3 | sanitização de HTML antes de renderizar |
| `framer-motion` | animações |
| `lucide-react` | ícones |
| `sonner` | toasts de feedback |
| `@pocketbase/js` | cliente PocketBase |
