@echo off
title Biblia Desktop - Modo Desarrollo
cd /d "%~dp0"

echo [*] Iniciando entorno de desarrollo (Vite + Electron con Hot-Reload)...
call npm run dev
