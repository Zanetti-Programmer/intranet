@AGENTS.md

# Contexto do app Next.js

Este é o frontend da intranet corporativa. Veja o `CLAUDE.md` na raiz do projeto para contexto completo de arquitetura e convenções.

## Convenções rápidas

- Todas as páginas: `"use client"` + `export const dynamic = "force-dynamic"`
- Layout autenticado: `<DashboardLayout pathname={pathname}>`
- Ícones: Lucide React v1.16.0 — usar `style={{ width: N, height: N }}` para tamanhos pequenos (<16px)
- Animações: Framer Motion (`motion.div`, `AnimatePresence`)
- Feedback: `toast.success/error` via sonner
- Estilo: Tailwind CSS + `cn()` para classes condicionais

## Nunca fazer

- Não criar páginas sem `DashboardLayout`
- Não importar `Image` do Next.js em páginas que já importam `Image` do lucide-react
- Não usar `useRouter().push` com rotas hardcoded — usar constantes ou pathname do sidebar
