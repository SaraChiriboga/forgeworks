#!/bin/bash
set -e

echo "==> [ForgeWorks API] Starting production container..."

# Esperar a que la base de datos esté lista
if [ -n "$DATABASE_URL" ]; then
  echo "==> [ForgeWorks API] Checking database connection..."
fi

# Ejecutar migraciones pendientes automáticamente
echo "==> [ForgeWorks API] Running database migrations..."
./bin/tasks db.migrate

# Ejecutar siembra de datos iniciales si está habilitado
if [ "${RUN_SEEDS:-false}" = "true" ]; then
  echo "==> [ForgeWorks API] Seeding initial sample data..."
  ./bin/tasks db.seed.sample_data || true
fi

# Iniciar servidor web de producción en el puerto configurado por Render ($PORT)
echo "==> [ForgeWorks API] Starting Lucky web server on port ${PORT:-10000}..."
exec ./bin/server
