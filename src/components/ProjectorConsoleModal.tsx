import React, { useState, useEffect } from 'react';
import {
  Tv,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  VolumeX,
  Type,
  Check,
  Palette,
  ExternalLink,
  Smartphone,
  Copy,
} from 'lucide-react';
import { ProjectorDisplay, ProjectorSlide, ProjectorTheme, ProjectorMode } from '../types';
import { projectorService } from '../services/projectorService';

interface ProjectorConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBookName: string;
  currentBookId: number;
  currentChapter: number;
  currentVerses: string[];
  selectedVerses: number[];
  onSelectVerse?: (verseNum: number) => void;
}

export const ProjectorConsoleModal: React.FC<ProjectorConsoleModalProps> = ({
  isOpen,
  onClose,
  currentBookName,
  currentBookId,
  currentChapter,
  currentVerses,
  selectedVerses,
  onSelectVerse,
}) => {
  const [displays, setDisplays] = useState<ProjectorDisplay[]>([]);
  const [selectedDisplayId, setSelectedDisplayId] = useState<number | undefined>(undefined);
  const [isProjectorActive, setIsProjectorActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<ProjectorSlide>(() => projectorService.getCurrentSlide());
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(() => {
    return selectedVerses.length > 0 ? selectedVerses[0] : 1;
  });
  const [networkInfo, setNetworkInfo] = useState<{ ip: string; port: number; url: string; connectedClients: number }>({
    ip: '10.90.23.81',
    port: 5173,
    url: 'http://10.90.23.81:5173/?mode=projector',
    connectedClients: 0,
  });
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Cargar monitores, estado e IP de red al abrir
  useEffect(() => {
    if (isOpen) {
      projectorService.getDisplays().then((dList) => {
        setDisplays(dList);
        const secondary = dList.find((d) => !d.isPrimary);
        if (secondary) {
          setSelectedDisplayId(secondary.id);
        } else if (dList.length > 0) {
          setSelectedDisplayId(dList[0].id);
        }
      });

      projectorService.getStatus().then((st) => {
        setIsProjectorActive(st.isOpen);
      });

      projectorService.getNetworkInfo().then((net) => {
        setNetworkInfo(net);
      });
    }

    const unsubSlide = projectorService.onSlideUpdate((newSlide) => {
      setCurrentSlide(newSlide);
    });

    const unsubStatus = projectorService.onStatusChange((st) => {
      setIsProjectorActive(st.isOpen);
    });

    return () => {
      unsubSlide();
      unsubStatus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Acciones de Proyección
  const handleToggleProjector = async () => {
    if (isProjectorActive) {
      await projectorService.closeProjector();
      setIsProjectorActive(false);
    } else {
      const res = await projectorService.openProjector(selectedDisplayId);
      setIsProjectorActive(res.success);
    }
  };

  const handleBroadcastVerse = (vNum: number) => {
    const text = currentVerses[vNum - 1];
    if (!text) return;

    setActiveVerseIndex(vNum);
    if (onSelectVerse) onSelectVerse(vNum);

    const slide = projectorService.createVerseSlide(
      currentBookName,
      currentChapter,
      vNum,
      undefined,
      text,
      currentSlide.theme,
      currentSlide.mode,
      currentSlide.fontSizeMultiplier
    );

    projectorService.sendSlide(slide);
  };

  const handlePrevVerse = () => {
    if (activeVerseIndex > 1) {
      handleBroadcastVerse(activeVerseIndex - 1);
    }
  };

  const handleNextVerse = () => {
    if (activeVerseIndex < currentVerses.length) {
      handleBroadcastVerse(activeVerseIndex + 1);
    }
  };

  const handleToggleBlackout = () => {
    const updated: ProjectorSlide = {
      ...currentSlide,
      blackout: !currentSlide.blackout,
      timestamp: Date.now(),
    };
    projectorService.sendSlide(updated);
  };

  const handleToggleLogo = () => {
    const updated: ProjectorSlide = {
      ...currentSlide,
      logo: !currentSlide.logo,
      blackout: false,
      timestamp: Date.now(),
    };
    projectorService.sendSlide(updated);
  };

  const handleSetTheme = (theme: ProjectorTheme) => {
    const updated: ProjectorSlide = {
      ...currentSlide,
      theme,
      timestamp: Date.now(),
    };
    projectorService.sendSlide(updated);
  };

  const handleSetMode = (mode: ProjectorMode) => {
    const updated: ProjectorSlide = {
      ...currentSlide,
      mode,
      timestamp: Date.now(),
    };
    projectorService.sendSlide(updated);
  };

  const handleFontScale = (delta: number) => {
    const next = Math.max(0.7, Math.min(1.6, (currentSlide.fontSizeMultiplier || 1.0) + delta));
    const updated: ProjectorSlide = {
      ...currentSlide,
      fontSizeMultiplier: parseFloat(next.toFixed(2)),
      timestamp: Date.now(),
    };
    projectorService.sendSlide(updated);
  };

  const themes: { id: ProjectorTheme; label: string; bg: string }[] = [
    { id: 'obsidian', label: 'Obsidiana Dorada', bg: 'bg-black border-amber-500' },
    { id: 'midnight', label: 'Azul Medianoche', bg: 'bg-[#030712] border-blue-500' },
    { id: 'papyri', label: 'Papiro Solemne', bg: 'bg-[#1c1917] border-amber-700' },
    { id: 'emerald', label: 'Paz Esmeralda', bg: 'bg-[#022c22] border-emerald-500' },
    { id: 'transparent', label: 'Lower Thirds (OBS)', bg: 'bg-stone-800 border-dashed border-stone-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera de la Consola */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-850/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Consola de Operador & Modo Proyector
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isProjectorActive
                      ? currentSlide.blackout
                        ? 'bg-stone-800 text-stone-300'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isProjectorActive ? (currentSlide.blackout ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse') : 'bg-stone-400'
                    }`}
                  />
                  <span>
                    {isProjectorActive
                      ? currentSlide.blackout
                        ? 'Blackout Activo'
                        : currentSlide.logo
                        ? 'En Espera (Logo)'
                        : 'En Vivo'
                      : 'Desconectado'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Control de proyección multimonitor en tiempo real para iglesias y predicación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleProjector}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isProjectorActive
                  ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{isProjectorActive ? 'Desconectar Pantalla' : 'Activar Proyector'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo de la Consola: 2 Columnas */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800">
          {/* Columna Izquierda: Monitor de Previsualización y Controles Principales */}
          <div className="w-full md:w-7/12 p-6 flex flex-col gap-5 overflow-y-auto">
            {/* Monitor de Previsualización en Vivo (16:9) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  Monitor de Salida (Lo que ve la congregación):
                </span>
                <span className="font-mono text-[11px] text-stone-400">16:9 HDMI 1080p</span>
              </div>

              {/* Marco de Pantalla */}
              <div className="w-full aspect-video rounded-xl bg-black border-2 border-stone-800 shadow-inner overflow-hidden relative flex flex-col justify-between p-4 sm:p-6 transition-all duration-300">
                {currentSlide.blackout ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-stone-600 text-xs gap-1">
                    <EyeOff className="w-8 h-8 text-stone-700 animate-pulse" />
                    <span>Blackout Activado (Pantalla Negra)</span>
                  </div>
                ) : currentSlide.logo ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <BookOpen className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-400">Biblia Sagrada</h3>
                    <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">Reina-Valera 1960</p>
                  </div>
                ) : currentSlide.mode === 'lowerThird' ? (
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="bg-black/90 border border-amber-500/40 rounded-lg p-3 text-left">
                      <div className="text-xs font-bold text-amber-400 mb-1">{currentSlide.title}</div>
                      <div className="text-xs italic text-stone-200 line-clamp-2">“{currentSlide.text}”</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-left border-b border-amber-500/20 pb-1">
                      <span className="text-sm font-bold text-amber-400 font-sans tracking-wide">
                        {currentSlide.title}
                      </span>
                    </div>
                    <div className="my-auto text-center px-4">
                      <p className="text-sm sm:text-base font-serif italic text-stone-100 line-clamp-4 leading-relaxed">
                        “{currentSlide.text}”
                      </p>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 border-t border-amber-500/10 pt-1">
                      <span>RVR 1960</span>
                      <span className="text-amber-500/80">{currentSlide.reference}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Botones de Control de Transmisión Inmediata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
              <button
                onClick={handleToggleBlackout}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all border ${
                  currentSlide.blackout
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-md'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750 border-stone-200 dark:border-stone-700'
                }`}
                title="Pone la pantalla en negro al instante para oración o momentos solemnes (F9)"
              >
                <EyeOff className="w-4 h-4" />
                <span>Blackout</span>
              </button>

              <button
                onClick={handleToggleLogo}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all border ${
                  currentSlide.logo && !currentSlide.blackout
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-md'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750 border-stone-200 dark:border-stone-700'
                }`}
                title="Muestra el logotipo de la Biblia y versículo de bienvenida (F10)"
              >
                <Sparkles className="w-4 h-4" />
                <span>Pantalla Espera</span>
              </button>

              <button
                onClick={() => handleSetMode(currentSlide.mode === 'full' ? 'lowerThird' : 'full')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all border ${
                  currentSlide.mode === 'lowerThird'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750 border-stone-200 dark:border-stone-700'
                }`}
                title="Alterna entre pantalla completa y tercio inferior para OBS"
              >
                <Layers className="w-4 h-4" />
                <span>{currentSlide.mode === 'lowerThird' ? 'Tercio Inferior' : 'Pantalla Completa'}</span>
              </button>

              {/* Selector de Monitor / Pantalla de Salida */}
              <div className="relative">
                <select
                  value={selectedDisplayId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedDisplayId(id);
                    if (isProjectorActive) {
                      projectorService.openProjector(id);
                    }
                  }}
                  className="w-full h-full py-2 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {displays.map((d, i) => (
                    <option key={d.id} value={d.id}>
                      {d.label || `Pantalla ${i + 1} (${d.bounds.width}x${d.bounds.height})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ajustes Rápidos: Temas Litúrgicos y Escala de Fuente */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-400 font-medium mr-1">Fondo:</span>
                {themes.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => handleSetTheme(th.id)}
                    className={`w-6 h-6 rounded-md border transition-all ${th.bg} ${
                      currentSlide.theme === th.id
                        ? 'ring-2 ring-amber-500 scale-110 shadow-sm'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={th.label}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] text-stone-400 font-medium mr-1">Tamaño:</span>
                <button
                  onClick={() => handleFontScale(-0.1)}
                  className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold"
                  title="Reducir tamaño del texto proyectado"
                >
                  A-
                </button>
                <span className="px-1 text-[11px] font-mono text-stone-400">
                  {Math.round((currentSlide.fontSizeMultiplier || 1.0) * 100)}%
                </span>
                <button
                  onClick={() => handleFontScale(0.1)}
                  className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold"
                  title="Aumentar tamaño del texto proyectado"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Proyección Móvil Inalámbrica (Android / Smart TV / Tablet sin drivers) */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      📱 Proyección en Teléfono Android o Tablet
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Sin cables ni drivers
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Abre en Google Chrome de tu teléfono (en el mismo Wi-Fi):
                  </p>
                  <code className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 select-all break-all">
                    {networkInfo.url}
                  </code>
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(networkInfo.url);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750 text-xs font-semibold text-stone-700 dark:text-stone-200 shadow-xs transition-all shrink-0"
                title="Copiar enlace para abrir en el teléfono"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar Enlace'}</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Selector Rápido de Versículos del Capítulo Actual */}
          <div className="w-full md:w-5/12 flex flex-col bg-stone-50/50 dark:bg-stone-900/50">
            {/* Navegador del Capítulo */}
            <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {currentBookName} {currentChapter}
                </span>
                <span className="text-[11px] text-stone-400 ml-1.5 font-sans">
                  ({currentVerses.length} versículos)
                </span>
              </div>

              {/* Botones de Pase de Versículo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevVerse}
                  disabled={activeVerseIndex <= 1}
                  className="p-1 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 text-stone-600 dark:text-stone-300 disabled:opacity-40 transition-colors"
                  title="Versículo anterior (Flecha Izquierda)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-1 font-mono">
                  v.{activeVerseIndex}
                </span>
                <button
                  onClick={handleNextVerse}
                  disabled={activeVerseIndex >= currentVerses.length}
                  className="p-1 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 text-stone-600 dark:text-stone-300 disabled:opacity-40 transition-colors"
                  title="Versículo siguiente (Flecha Derecha)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista Desplazable de Versículos para Enviar en Vivo */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-stone-100 dark:divide-stone-800/60 max-h-[380px] md:max-h-none">
              {currentVerses.map((text, idx) => {
                const vNum = idx + 1;
                const isLive = currentSlide.type === 'verse' && currentSlide.title.includes(`${currentBookName} ${currentChapter}:${vNum}`);

                return (
                  <button
                    key={vNum}
                    onClick={() => handleBroadcastVerse(vNum)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 ${
                      isLive
                        ? 'bg-amber-500/15 border border-amber-500/40 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800/70 border border-transparent text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        isLive
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {vNum}
                    </span>
                    <p className="text-xs leading-relaxed flex-1 line-clamp-2 font-serif">
                      {text}
                    </p>
                    {isLive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping self-center" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barra Inferior de Información y Atajos */}
        <div className="px-6 py-2.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-wrap items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-3">
            <span>Atajos de Proyección:</span>
            <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300">
              F9: Blackout
            </span>
            <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300">
              F10: Logo
            </span>
            <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300">
              F: Pantalla Completa
            </span>
          </div>
          <div>Biblia RVR 1960 • SoyJhery</div>
        </div>
      </div>
    </div>
  );
};
