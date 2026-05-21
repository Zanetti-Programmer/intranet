#!/bin/bash
# Cria o banco do GLPI e concede acesso ao usuário da aplicação.
# O banco do HumHub já é criado automaticamente via MYSQL_DATABASE no compose.
set -e

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS glpi
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    GRANT ALL PRIVILEGES ON glpi.* TO '${MYSQL_USER}'@'%';

    FLUSH PRIVILEGES;
EOSQL
