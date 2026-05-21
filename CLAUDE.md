# Contexto do Projeto — Intranet Corporativa

## O que é este projeto

Intranet corporativa open source baseada em **HumHub** (rede social interna) + **GLPI** (chamados de TI), orquestrada via Docker Compose com nginx como proxy reverso.

## Decisões de arquitetura

- **HumHub** escolhido por ser a plataforma open source mais completa de intranet social (PHP/Yii2, fácil de customizar e hospedar).
- **GLPI** para gestão de chamados de TI — padrão ITIL, em português, com SLA e agentes.
- **MariaDB 10.11** compartilhado entre os dois sistemas (bancos separados: `humhub` e `glpi`).
- **nginx** como reverse proxy: HumHub na porta 80, GLPI na porta 8080.
- O GLPI serve da raiz `/` internamente — não funciona em subpath, por isso porta separada.
- Imagem `mriedmann/humhub` (community, Alpine) e `diouxx/glpi` com `platform: linux/amd64` (emulação Rosetta no Mac Apple Silicon).

## Stack

| Serviço | Imagem | Porta interna | Porta externa |
|---|---|---|---|
| nginx (proxy) | nginx:alpine | 80 / 8080 | 80 / 8080 |
| HumHub | mriedmann/humhub:latest | 80 | via nginx:80 |
| GLPI | diouxx/glpi:latest | 80 | via nginx:8080 |
| MariaDB | mariadb:10.11 | 3306 | — |

## Variáveis de ambiente

Copiar `.env.example` para `.env` e preencher antes de subir. O `.env` nunca deve ser commitado.

## Como subir o ambiente

```bash
cp .env.example .env
# editar .env com as senhas reais
docker compose up -d
docker compose logs -f
```

## Primeiro acesso ao GLPI

O GLPI exige wizard de instalação no primeiro boot. Dados do banco:
- Host: `db`
- Banco: `glpi`
- Usuário/Senha: conforme `.env` (DB_USER / DB_PASSWORD)

Após instalar: trocar a senha padrão `glpi`/`glpi`.

## Funcionalidades planejadas (ainda não implementadas)

Ver README.md para a lista completa de features desejadas e roadmap.

## Módulos HumHub a instalar

Acessar `http://localhost/marketplace` após login admin:
- Calendar (gratuito)
- Tasks (gratuito)
- Chat (gratuito)
- Gallery (gratuito)
- Polls (gratuito)

## Customizações futuras planejadas

- Módulo PHP custom para widget do Instagram (Instagram Graph API)
- Módulo de marketplace interno (classificados de itens da empresa)
- Mural de conquistas / badges de RH customizados
- Integração HumHub ↔ GLPI via link no menu de navegação
