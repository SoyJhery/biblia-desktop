# Changelog

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-01

### Added
- **Base de datos bíblica canónica Reina-Valera 1960:**
  - Inclusión offline completa de los 66 libros del Antiguo y Nuevo Testamento.
  - 1,189 capítulos y 31,104 versículos normalizados.
  - Clasificación temática por géneros bíblicos (Pentateuco, Históricos, Poéticos, Profetas, Evangelios, Epístolas, etc.).
- **Motor de lectura interactivo y accesible:**
  - Soporte para selector de temas visuales: Modo Oscuro Profundo (*Dark Slate*), Modo Papiro/Sepia y Modo Claro.
  - Configuración tipográfica personalizada: tipografía Serif (clásica) y Sans (moderna), selector de tamaño de fuente (15px-28px) e interlineado.
  - Numeración de versículos alternable.
- **Sistema de agrupación y colecciones temáticas:**
  - Capacidad para crear grupos/carpetas de estudio con etiquetas de colores personalizadas.
  - Posibilidad de añadir versículos individuales, rangos seleccionados o capítulos completos a cualquier grupo.
  - Notas de estudio personales editables por cada elemento del grupo.
  - Salto directo desde cualquier grupo al versículo en el lector.
- **Marcadores de lectura y favoritos:**
  - Sistema de guardado de puntos de lectura activos (Marcadores) con etiquetas personalizadas.
  - Colección de versículos favoritos con filtrado instantáneo y copiado rápido.
- **Buscador global:**
  - Búsqueda en tiempo real insensible a mayúsculas y acentos diacríticos.
  - Filtros por ámbito: Toda la Biblia, Antiguo Testamento, Nuevo Testamento o Libro actual.
  - Resaltado visual de términos coincidentes y salto con animación *flash* al versículo.
- **Barra de acción flotante contextual:**
  - Menú emergente al seleccionar uno o múltiples versículos (favorito, resaltado en 5 colores, agrupar, marcar y copiar cita con formato canónico).
- **Persistencia y respaldos:**
  - Persistencia segura en el perfil de usuario del sistema operativo vía Electron IPC.
  - Soporte de exportación e importación de respaldos en formato JSON.
- **Compilación y empaquetado multiplataforma:**
  - Generación de instalador para Windows (`.exe` NSIS y versión portable).
  - Compatible y ejecutable nativamente en sistemas Linux.

### Fixed
- Corrección en resolución de entorno en `run.sh` fijando `NODE_ENV=production` y mecanismo de respaldo a `dist/index.html` en el proceso principal de Electron ante ausencia de servidor de desarrollo.

