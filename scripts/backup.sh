#!/bin/sh
# Backup diário do PocketBase via API oficial (evita corrupção de WAL)
# Executado pelo container 'backup' às 2h via crond

PB_URL="${PB_URL:-http://pocketbase:8090}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +%Y%m%d_%H%M%S)

echo "[backup] Iniciando backup $DATE"

# Autenticar como superadmin e obter token
TOKEN=$(wget -qO- \
  --post-data="{\"identity\":\"${PB_ADMIN_EMAIL}\",\"password\":\"${PB_ADMIN_PASSWORD}\"}" \
  --header="Content-Type: application/json" \
  "${PB_URL}/api/admins/auth-with-password" 2>/dev/null \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "[backup] ERRO: falha na autenticação"
  exit 1
fi

# Triggar criação de backup no PocketBase
HTTP_STATUS=$(wget -qO/dev/null \
  --method=POST \
  --header="Authorization: Bearer $TOKEN" \
  --server-response \
  "${PB_URL}/api/backups" 2>&1 | grep "HTTP/" | tail -1 | awk '{print $2}')

if [ "$HTTP_STATUS" != "204" ] && [ "$HTTP_STATUS" != "200" ]; then
  echo "[backup] AVISO: status inesperado $HTTP_STATUS ao criar backup"
fi

# Listar backups e baixar o mais recente
LATEST=$(wget -qO- \
  --header="Authorization: Bearer $TOKEN" \
  "${PB_URL}/api/backups" 2>/dev/null \
  | grep -o '"key":"[^"]*"' | tail -1 | cut -d'"' -f4)

if [ -n "$LATEST" ]; then
  mkdir -p "$BACKUP_DIR"
  wget -qO "${BACKUP_DIR}/backup_${DATE}.zip" \
    --header="Authorization: Bearer $TOKEN" \
    "${PB_URL}/api/backups/${LATEST}" 2>/dev/null
  echo "[backup] Arquivo: backup_${DATE}.zip"
else
  echo "[backup] AVISO: nenhum backup listado"
fi

# Manter apenas os últimos 7 backups
ls -t "${BACKUP_DIR}"/backup_*.zip 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true

echo "[backup] Concluído"
