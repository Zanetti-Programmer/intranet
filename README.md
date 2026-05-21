# Intranet Corporativa

Intranet open source completa com visual de rede social, chamados de TI, chat, calendário, galeria de fotos e muito mais — tudo self-hosted via Docker.

---

## Visão do produto

A ideia é ter uma intranet que pareça uma rede social corporativa, com tudo que a equipe precisa em um só lugar:

| Funcionalidade | Status | Ferramenta |
|---|---|---|
| Feed social / mural de posts | ✅ Funcionando | HumHub |
| Perfil único por colaborador | ✅ Funcionando | HumHub |
| Chat privado entre pessoas | ✅ Funcionando | HumHub (módulo Chat) |
| Chat em grupos / departamentos | ✅ Funcionando | HumHub (Spaces) |
| Calendário corporativo | ✅ Disponível | HumHub (módulo Calendar) |
| Avisos importantes / RH | ✅ Disponível | HumHub (posts fixados) |
| Galeria de fotos de eventos | ✅ Disponível | HumHub (módulo Gallery) |
| Chamados de suporte TI | ✅ Funcionando | GLPI (porta 8080) |
| Mural de conquistas / badges | 🔜 Planejado | HumHub (módulo Badges) |
| Marketplace interno (classificados) | 🔜 Planejado | Módulo custom HumHub |
| Widget Instagram (últimas 5 fotos) | 🔜 Planejado | Módulo custom HumHub |
| Avisos de RH destacados | 🔜 Planejado | Space privado RH |

---

## Como subir

### Pré-requisitos
- Docker Desktop instalado e rodando

### 1. Configurar variáveis

```bash
cp .env.example .env
```

Editar o `.env` com as senhas e e-mail do admin:

```env
DB_ROOT_PASSWORD=SenhaForte@2024
DB_USER=intranet_user
DB_PASSWORD=OutraSenha@2024

ADMIN_EMAIL=admin@suaempresa.com
ADMIN_USER=admin
ADMIN_PASSWORD=AdminSenha@2024
SITE_NAME=Intranet da Empresa

TIMEZONE=America/Sao_Paulo
HTTP_PORT=80
```

### 2. Subir os containers

```bash
docker compose up -d
```

Aguardar ~60 segundos no primeiro boot.

### 3. Verificar status

```bash
docker compose ps
```

---

## Acesso

| Sistema | URL | Credenciais |
|---|---|---|
| **HumHub** (intranet) | `http://localhost/` | `admin` + senha do `.env` |
| **GLPI** (chamados TI) | `http://localhost:8080/` | wizard no 1º acesso |

### Primeiro acesso ao GLPI

O GLPI exige um wizard de instalação. Quando pedir o banco de dados:

- **Host:** `db`
- **Banco:** `glpi`
- **Usuário:** valor de `DB_USER` no `.env`
- **Senha:** valor de `DB_PASSWORD` no `.env`

Após instalar, trocar a senha padrão `glpi` / `glpi`.

---

## Arquitetura

```
Internet / Rede local
        │
   nginx :80 / :8080
   ┌─────┴──────┐
   │            │
HumHub:80   GLPI:80
   │            │
   └─────┬──────┘
         │
    MariaDB:3306
    ├── banco: humhub
    └── banco: glpi
```

---

## Módulos HumHub recomendados

Instalar via painel admin em `/marketplace`:

- **Calendar** — calendário compartilhado por departamento
- **Tasks** — tarefas e to-dos
- **Chat** — mensagens em tempo real
- **Gallery** — álbuns de fotos de eventos
- **Polls** — enquetes para a equipe
- **Badges** — conquistas e reconhecimentos

---

## Próximas implementações

### Widget Instagram
Módulo PHP customizado que consome a **Instagram Graph API** e exibe as últimas 5 publicações (fotos/vídeos) do perfil da empresa diretamente no feed da intranet.

### Marketplace interno (Classificados)
Espaço dentro do HumHub onde colaboradores podem anunciar itens da empresa para venda interna (ex: cadeira executiva, equipamentos sem uso). Não é e-commerce — é um quadro de classificados corporativo.

### Mural de conquistas de RH
Badges e destaques customizados pelo RH: colaborador do mês, aniversariantes, novos colaboradores, metas batidas.

---

## Comandos úteis

```bash
# Subir
docker compose up -d

# Ver logs em tempo real
docker compose logs -f

# Parar tudo
docker compose down

# Parar e remover volumes (APAGA DADOS)
docker compose down -v

# Reiniciar um serviço específico
docker compose restart humhub
```

---

## Estrutura do projeto

```
intranet/
├── docker-compose.yml     # Orquestração dos containers
├── .env                   # Senhas e config (não commitado)
├── .env.example           # Template das variáveis
├── nginx/
│   └── nginx.conf         # Proxy reverso
└── init-db/
    └── 01-glpi-database.sh  # Cria o banco do GLPI no MariaDB
```
