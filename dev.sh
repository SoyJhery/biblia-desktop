#!/usr/bin/env bash
# ==============================================================================
# Nombre: dev.sh
# Versión: 0.1.0
# Descripción: Gestor de entorno de desarrollo con control por PID para Biblia RVR 1960
# Uso: ./dev.sh [start|stop|restart|status|log]
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PID_FILE="$DIR/.server.pid"
LOG_FILE="$DIR/.dev.log"
PORT=5173

check_port() {
  if ss -tuln | grep -q ":$PORT "; then
    return 0 # Puerto ocupado
  fi
  return 1 # Puerto libre
}

start() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "⚠️ El servidor ya está en ejecución (PID: $PID)."
      exit 0
    else
      rm -f "$PID_FILE"
    fi
  fi

  if check_port; then
    echo "❌ Error: El puerto $PORT ya está ocupado por otro proceso."
    exit 1
  fi

  echo "🚀 Iniciando entorno de desarrollo en http://127.0.0.1:$PORT..."
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  PID=$!
  echo "$PID" > "$PID_FILE"
  echo "✅ Servidor iniciado con éxito (PID: $PID)."
  echo "📄 Logs en tiempo real disponibles con: ./dev.sh log"
}

stop() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "🛑 Deteniendo entorno de desarrollo (PID: $PID)..."
    kill "$PID" 2>/dev/null || true
    # Matar procesos hijos si existen
    pkill -P "$PID" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo "✅ Proceso detenido."
  else
    echo "ℹ️ No se encontró archivo PID. Verificando si hay procesos en el puerto $PORT..."
    fuser -k $PORT/tcp 2>/dev/null || true
    echo "Listo."
  fi
}

status() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "🟢 Estado: EN EJECUCIÓN (PID: $PID en http://127.0.0.1:$PORT)"
      return 0
    fi
  fi
  if check_port; then
    echo "🟡 Estado: Puerto $PORT ocupado por un proceso externo."
  else
    echo "⚪ Estado: DETENIDO."
  fi
}

log() {
  if [ -f "$LOG_FILE" ]; then
    tail -f "$LOG_FILE"
  else
    echo "ℹ️ No se ha generado archivo de logs aún ($LOG_FILE)."
  fi
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    sleep 1
    start
    ;;
  status)
    status
    ;;
  log)
    log
    ;;
  *)
    echo "Uso: $0 {start|stop|restart|status|log}"
    exit 1
    ;;
esac
