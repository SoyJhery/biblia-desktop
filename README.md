# 📖 Biblia RVR 1960 Desktop — Una app de SoyJhery

Aplicación moderna de estudio bíblico multiplataforma para Windows y Linux, desarrollada y firmada por **SoyJhery**. Basada en el texto canónico de la **Reina-Valera 1960**...

---

## 1. 🎯 Propósito
Proporcionar una herramienta de lectura y estudio de las Sagradas Escrituras 100% offline, altamente estética y personalizable, que permita a los creyentes y estudiantes bíblicos organizar pasajes en colecciones temáticas (promesas, consuelo, doctrina), realizar búsquedas instantáneas en los 66 libros y acceder rápidamente a sus versículos favoritos tanto en Windows (`.exe`) como en distribuciones Linux.

---

## 2. 📋 Requisitos
- **Node.js**: v18.0.0 o superior (recomendado v20+ / v24).
- **npm** o **pnpm** como gestor de paquetes.
- **Wine** (opcional, solo si se desea compilar ejecutables `.exe` para Windows desde entornos Linux).
- **Sistema Operativo**: Linux (Ubuntu, Mint, Debian, Arch, etc.) o Windows 10/11.

---

## 3. 🚀 Instalación y Arranque Rápido

### Instalación de dependencias
```bash
npm install
```

### Ejecución en Modo Desarrollo
Para iniciar el entorno interactivo de desarrollo:
```bash
./dev.sh start     # Inicia en segundo plano con control por PID
./dev.sh status    # Verifica el estado del proceso
./dev.sh log       # Visualiza los logs en tiempo real
./dev.sh stop      # Detiene el servidor
```
O de forma directa:
```bash
npm run dev
```

### Lanzador Rápido (Producción Local)
```bash
./run.sh
```

### Compilación de Ejecutables Multiplataforma

- **Para Windows (`.exe` instalador NSIS y Portable):**
  ```bash
  npm run dist:win
  ```
  *Genera `Biblia RVR 1960-Setup-0.1.0.exe` dentro de la carpeta `release/`.*

- **Para Linux (`.AppImage` / `.deb`):**
  ```bash
  npm run dist:linux
  ```

---

## 4. 📂 Estructura del Proyecto

```text
biblia-desktop/
├── electron/
│   ├── main.ts             # Proceso principal de Electron, persistencia y diálogos
│   └── preload.ts          # Bridge seguro contextBridge (IPC)
├── src/
│   ├── assets/             # Recursos estáticos e iconos
│   ├── components/
│   │   ├── Header.tsx           # Barra superior con navegación y selector de libros
│   │   ├── Reader.tsx           # Lector central con tipografía y badges
│   │   ├── NavigationModal.tsx  # Selector rápido de 66 libros y cuadrícula de capítulos
│   │   ├── VerseActionBar.tsx   # Menú contextual flotante de selección
│   │   ├── CollectionsModal.tsx # Gestor de Grupos y Colecciones temáticas
│   │   ├── SearchModal.tsx      # Buscador global insensible a acentos
│   │   ├── BookmarksDrawer.tsx  # Panel lateral de marcadores de lectura
│   │   ├── FavoritesDrawer.tsx  # Panel lateral de versículos favoritos
│   │   └── SettingsModal.tsx    # Ajustes de tema (Oscuro/Sepia/Claro), fuente y respaldo
│   ├── data/
│   │   ├── books.json           # Metadatos canónicos de los 66 libros
│   │   ├── bible-verses.json    # 31,104 versículos estructurados O(1)
│   │   └── bible.db             # Base de datos SQLite FTS5 generada
│   ├── services/
│   │   ├── bibleService.ts      # Búsquedas y utilidades de referencia bíblica
│   │   └── storageService.ts    # Persistencia local y exportación/importación de respaldos
│   ├── types/
│   │   ├── index.ts             # Definición de tipos TypeScript del dominio
│   │   └── electron.d.ts        # Tipado global de window.electronAPI
│   ├── App.tsx                  # Componente raíz del estudio bíblico
│   ├── index.css                # Estilos globales, paletas de tema y resaltados
│   └── main.tsx                 # Entrada principal de React
├── CHANGELOG.md             # Historial de cambios bajo estándar Keep a Changelog
├── package.json             # Manifiesto del proyecto (SemVer 0.1.0)
├── run.sh                   # Script de ejecución rápida
└── dev.sh                   # Script de control de ciclo de vida con PID
```

---

## 5. 🏷️ Autoría, Contacto y Copyright
- **Creado por:** SoyJhery
- **Correo Oficial de Soporte y Colaboración:** [soyjhery@gmail.com](mailto:soyjhery@gmail.com)
- **Versión:** `0.1.0` (SemVer)
- **Texto Bíblico:** Reina-Valera 1960 (RVR1960)
- **Derechos de Autor:** Copyright © 2026 SoyJhery. Todos los derechos reservados.

