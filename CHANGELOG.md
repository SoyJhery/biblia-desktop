# Changelog

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-10-02

### Added
- **Modo Proyector & Segunda Pantalla Multimonitor (*Multi-Display Church & Stream Projector*):**
  - Detección multimonitor nativa con Electron `screen` API para identificar pantallas secundarias (HDMI, DisplayPort, VGA o proyectores inalámbricos).
  - Ventana de proyección dedicada independiente sin bordes (*borderless fullscreen*) que se abre en la segunda pantalla seleccionada (`projectorWindow`).
  - Consola de Operador Eclesiástico en la ventana principal con:
    - Monitor de salida en vivo con relación de aspecto 16:9 que muestra en tiempo real lo que ve la congregación.
    - Modo *Blackout* (F9): pantalla negra instantánea para momentos solemnes y de oración.
    - Modo *Pantalla de Espera / Logo* (F10): presentación solemne del logotipo de la Biblia y Salmos 119:105.
    - Modo *Tercio Inferior* (*Lower Thirds*): renderizado en la zona inferior de la pantalla para superposición en OBS Studio, vMix o transmisiones en directo.
    - Paletas litúrgicas de fondo: *Obsidiana Dorada*, *Azul Medianoche*, *Papiro Solemne*, *Paz Esmeralda* y fondo transparente para streaming.
    - Control de escala tipográfica en vivo (70% - 160%).
    - Lista interactiva de versículos del capítulo en curso para transmisión con un clic.
  - Sincronización universal en tiempo real: comunicación bidireccional por IPC en Electron y fallback con `BroadcastChannel` para navegador o popups.
  - Botón directo `"Proyectar"` en la barra de acción contextual flotante (`VerseActionBar`) al seleccionar cualquier versículo o pasaje.
  - Botón directo de proyección de bosquejos homiléticos desde el `StudyNotebook`.
  - Botón `"Proyector"` en la barra superior con indicador de estado (Desconectado, En Vivo, Blackout, Espera).
  - Atajos de teclado para el operador: `F9` (Blackout), `F10` (Logo), `F` (Pantalla Completa), `Ctrl+Shift+P` (Abrir/Cerrar Consola).

## [0.3.0] - 2026-10-01

### Added
- **Cuaderno de Bosquejos & Estudio en Pantalla Dividida (*Split-View Sermon & Study Notebook*):**
  - Panel lateral integrado que permite estudiar las Escrituras en el lector bíblico a la izquierda mientras se escriben prédicas, bosquejos o reflexiones a la derecha en tiempo real.
  - Modo pantalla dividida adaptable y botón para maximizar a pantalla completa para concentración total de escritura.
  - Barra de herramientas Markdown integrada (títulos H1, H2, H3, negrita, cursiva, citas en bloque `>`, listas con viñetas y numeradas, separadores).
  - Botón de inserción inteligente: `"+ Citar pasaje actual"`, que formatea e incrusta la porción bíblica seleccionada en el texto y la vincula de inmediato a la nota.
  - Sistema de versículos vinculados interactivo: insignias con referencias bíblicas dentro de cada bosquejo; al hacer clic sobre cualquier cita, el lector bíblico navega automáticamente a ese capítulo y versículo.
  - Modo alternable entre **Editor** (con atajos de formato) y **Púlpito / Vista Previa Formateada** (tipografía editorial de alta legibilidad para ministrar y predicar desde el atril).
  - Gestión integral de notas con etiquetado dinámico (`#tags`), buscador de notas en tiempo real y filtrado por temas.
  - Exportación y compartición avanzada:
    - Copiado al portapapeles con atribución y firma de SoyJhery.
    - Exportación a archivo de texto Markdown (`.md`).
    - Preparación directa para impresión limpia o guardado a PDF (`Ctrl+P` / botón imprimir).
  - Botón directo `"A Nota"` en la barra flotante de selección de versículos para anexar pasajes rápidamente a un bosquejo existente o nuevo.
  - Atajo global de teclado `Ctrl+E` (o `Cmd+E`) para alternar instantáneamente la visibilidad del cuaderno.
  - Bosquejo homilético precargado de inspiración: *"Bosquejo: La Armadura de Dios y la Victoria Espiritual"* (Efesios 6:10-18).

## [0.2.0] - 2026-10-01

### Added
- **Estudio de Tarjetas Visuales de Versículos (*Verse Card Studio*):**
  - Generador interactivo de imágenes de alta resolución ($1080\times1080$ y $1080\times1920$) para estados de WhatsApp, historias de Instagram y publicaciones en redes.
  - 6 estilos de diseño prémium: *Obsidiana Dorada*, *Azul Celestial*, *Paz Esmeralda*, *Púrpura Real*, *Papiro Clásico* y *Minimalista Blanco*.
  - Opciones de personalización tipográfica (Serif clásico vs Sans contemporáneo), alineación y escala de fuente.
  - Descarga directa en formato PNG en alta definición y copiado directo de imagen al portapapeles.
  - Firma y sello visual oficial: `📖 Biblia RVR 1960 • Una app de SoyJhery`.
- **Botón directo "Crear Imagen" en la barra de acción flotante** al seleccionar uno o múltiples versículos.

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
- **Identidad, autoría y soporte oficial de SoyJhery:**
  - Inclusión de copyright oficial `Copyright © 2026 SoyJhery. Todos los derechos reservados.`
  - Insignia de creador en barra superior (`SoyJhery`), metadatos de aplicación y ventana.
  - Sección interactiva en ajustes con correo oficial de contacto y apoyo (`soyjhery@gmail.com`) con botón de copiado rápido al portapapeles.

### Fixed
- Corrección en resolución de entorno en `run.sh` fijando `NODE_ENV=production` y mecanismo de respaldo a `dist/index.html` en el proceso principal de Electron ante ausencia de servidor de desarrollo.
- Corrección de paleta de colores para tarjetas de libros en modo oscuro agregando tonalidades `stone-850` y `stone-750` en Tailwind CSS.
- Supresión de avisos cosméticos del subsistema VA-API (`libva error`) en terminal.

