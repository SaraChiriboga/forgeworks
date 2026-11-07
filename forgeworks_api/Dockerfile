# Imagen oficial de Crystal 1.20
FROM crystallang/crystal:1.20.0

WORKDIR /app

# Instalar cliente de PostgreSQL y utilidades del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    ca-certificates \
    tzdata \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar manifiesto de dependencias para aprovechar caché de capas Docker
COPY shard.yml shard.lock ./
RUN shards install --production --without-development

# Copiar el código fuente completo de la API
COPY . .

# Compilar el servidor web principal y el ejecutor de tareas/migraciones en modo release
RUN crystal build src/start_server.cr --release --no-debug -o bin/server
RUN crystal build tasks.cr --release --no-debug -o bin/tasks

# Script de entrada para migraciones automáticas al desplegar
COPY docker/production_entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Variables de entorno por defecto de producción
ENV LUCKY_ENV=production
ENV PORT=10000

EXPOSE 10000

ENTRYPOINT ["/app/entrypoint.sh"]
