@echo off
title Biblia RVR 1960 Desktop
cd /d "%~dp0"

echo ========================================================
echo   Biblia RVR 1960 Desktop - Lanzador Windows
echo ========================================================
echo.

if not exist "node_modules\" (
    echo [*] Instalando dependencias...
    call npm install
)

echo [*] Verificando compilacion de interfaz...
call npm run build:vite

echo [*] Verificando compilacion de Electron...
call npm run build:electron

echo [*] Abriendo la ventana de Electron...
start "" npx electron .

exit /b 0
