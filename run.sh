#!/usr/bin/env bash
# ==============================================================================
# Nombre: run.sh
# Versión: 0.1.0
# Descripción: Lanzador rápido para Biblia RVR 1960 Desktop
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== Iniciando Biblia RVR 1960 Desktop ==="

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias necesarias..."
  npm install
fi

# Construir si no existen los artefactos
if [ ! -d "dist" ] || [ ! -d "dist-electron" ]; then
  echo "Compilando aplicación..."
  npm run build
fi

# Establecer entorno de producción y ejecutar filtrando avisos cosméticos del sistema (GTK / libva / GLib)
export NODE_ENV=production
export LIBVA_DRIVER_NAME=none
exec npx electron . "$@" 2> >(grep -v -E "Gtk-WARNING|Theme parsing error|libva error|iHD_drv_video|GLib-GObject|browser_main_loop.cc" >&2)

