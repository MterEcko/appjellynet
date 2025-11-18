#!/bin/bash

# StreamQbit Backend Setup Script
# Este script automatiza la configuración inicial del backend

set -e  # Exit on error

echo "======================================"
echo "StreamQbit Backend Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js
echo -e "${YELLOW}[1/7] Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version) encontrado${NC}"
echo ""

# Step 2: Check .env file
echo -e "${YELLOW}[2/7] Verificando archivo .env...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ Archivo .env no encontrado, copiando desde .env.example${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ IMPORTANTE: Edita el archivo .env con tus configuraciones${NC}"
else
    echo -e "${GREEN}✓ Archivo .env encontrado${NC}"
fi
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}[3/7] Instalando dependencias...${NC}"
npm install
echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

# Step 4: Copy Prisma schema if needed
echo -e "${YELLOW}[4/7] Verificando Prisma schema...${NC}"
if [ ! -d prisma ]; then
    mkdir -p prisma
fi
if [ -f src/prisma/schema.prisma ] && [ ! -f prisma/schema.prisma ]; then
    echo -e "${YELLOW}Copiando schema.prisma a la ubicación correcta...${NC}"
    cp src/prisma/schema.prisma prisma/schema.prisma
fi
echo -e "${GREEN}✓ Prisma schema verificado${NC}"
echo ""

# Step 5: Generate Prisma Client
echo -e "${YELLOW}[5/7] Generando cliente de Prisma...${NC}"
if PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate; then
    echo -e "${GREEN}✓ Cliente de Prisma generado${NC}"
else
    echo -e "${RED}✗ Error al generar cliente de Prisma${NC}"
    echo -e "${YELLOW}Esto puede deberse a problemas temporales con los servidores de Prisma${NC}"
    echo -e "${YELLOW}Intenta ejecutar manualmente: npx prisma generate${NC}"
    echo ""
    echo -e "${YELLOW}Continuando con el resto de la configuración...${NC}"
fi
echo ""

# Step 6: Compile TypeScript
echo -e "${YELLOW}[6/7] Compilando TypeScript...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ TypeScript compilado${NC}"
else
    echo -e "${YELLOW}⚠ Hubo errores al compilar, pero el código puede funcionar parcialmente${NC}"
fi
echo ""

# Step 7: Database setup (optional)
echo -e "${YELLOW}[7/7] Configuración de base de datos (opcional)${NC}"
read -p "¿Quieres ejecutar las migraciones de Prisma ahora? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npx prisma migrate dev --name init; then
        echo -e "${GREEN}✓ Migraciones aplicadas${NC}"
    else
        echo -e "${RED}✗ Error al aplicar migraciones${NC}"
        echo -e "${YELLOW}Asegúrate de que PostgreSQL esté corriendo y el DATABASE_URL en .env sea correcto${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Saltando migraciones. Ejecuta 'npm run prisma:migrate' cuando estés listo${NC}"
fi
echo ""

echo "======================================"
echo -e "${GREEN}Setup completado!${NC}"
echo "======================================"
echo ""
echo "Próximos pasos:"
echo "1. Edita el archivo .env con tus configuraciones"
echo "2. Asegúrate de que PostgreSQL esté corriendo"
echo "3. Ejecuta 'npm run prisma:migrate' para crear las tablas"
echo "4. Ejecuta 'npm start' para iniciar el servidor"
echo "   O 'npm run dev' para modo desarrollo"
echo ""
