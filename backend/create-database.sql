-- Script SQL para crear la base de datos StreamQbit
-- Ejecuta este script en PostgreSQL (pgAdmin o psql)

-- 1. Conectarse a PostgreSQL como usuario postgres
-- 2. Ejecutar este script

-- Crear la base de datos si no existe
CREATE DATABASE streamqbit
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Comentario para la base de datos
COMMENT ON DATABASE streamqbit
    IS 'Base de datos para StreamQbit - Plataforma de streaming con Jellyfin';

-- Conectar a la base de datos recién creada
\c streamqbit;

-- Las tablas se crearán automáticamente cuando ejecutes:
-- npx prisma migrate dev --name init
-- o
-- npx prisma db push

-- Para verificar que la base de datos existe:
-- SELECT datname FROM pg_database WHERE datname = 'streamqbit';
