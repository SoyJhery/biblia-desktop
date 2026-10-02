import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Sparkles, EyeOff, Shield, Maximize2, Minimize2 } from 'lucide-react';
import { ProjectorSlide, ProjectorTheme } from '../types';
import { projectorService } from '../services/projectorService';

export const ProjectorScreen: React.FC = () => {
  const [slide, setSlide] = useState<ProjectorSlide>(() => projectorService.getCurrentSlide());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Sincronizar diapositivas en tiempo real desde la consola del operador
    const unsubscribe = projectorService.onSlideUpdate((newSlide) => {
      setSlide(newSlide);
    });

    // Detectar cambios de pantalla completa
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Atajos de teclado en la ventana de proyección
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key.toLowerCase() === 'b') {
        projectorService.sendSlide({
          ...slide,
          blackout: !slide.blackout,
          timestamp: Date.now(),
        });
      } else if (e.key.toLowerCase() === 'l') {
        projectorService.sendSlide({
          ...slide,
          logo: !slide.logo,
          blackout: false,
          timestamp: Date.now(),
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slide]);

  // Paletas de Fondo Litúrgicas
  const themeClasses = useMemo(() => {
    switch (slide.theme) {
      case 'midnight':
        return 'bg-gradient-to-b from-[#030712] via-[#0b1329] to-[#030712] text-white';
      case 'papyri':
        return 'bg-gradient-to-b from-[#1c1917] via-[#292524] to-[#1c1917] text-amber-50';
      case 'emerald':
        return 'bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#022c22] text-emerald-50';
      case 'transparent':
        return 'bg-transparent text-white';
      case 'obsidian':
      default:
        return 'bg-black text-white';
    }
  }, [slide.theme]);

  // Si está activo el modo Blackout (Pantalla Negra)
  if (slide.blackout) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center cursor-none select-none z-50 transition-opacity duration-300">
        <span className="sr-only">Blackout activado</span>
      </div>
    );
  }

  // Si está activa la Pantalla de Logo / Espera Litúrgica
  if (slide.logo) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center p-8 text-center select-none z-50 transition-all duration-500 ${themeClasses}`}>
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shadow-2xl shadow-amber-500/20 animate-pulse">
            <BookOpen className="w-12 h-12 text-amber-400" />
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-serif text-amber-400 mb-3 drop-shadow-md">
          Biblia Sagrada
        </h1>

        <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent my-2" />

        <p className="text-xl sm:text-2xl font-medium tracking-wide text-stone-300 uppercase font-sans mb-8">
          Reina-Valera 1960
        </p>

        <blockquote className="max-w-2xl text-lg sm:text-2xl italic font-serif text-stone-300/90 leading-relaxed px-4">
          “Lámpara es a mis pies tu palabra, y lumbrera a mi camino.”
          <footer className="text-sm sm:text-base font-sans font-bold text-amber-400/80 mt-2 not-italic">
            Salmos 119:105
          </footer>
        </blockquote>

        <div className="absolute bottom-6 text-xs text-stone-500 font-sans tracking-wider">
          Biblia RVR 1960 • SoyJhery
        </div>
      </div>
    );
  }

  const fontScale = slide.fontSizeMultiplier || 1.0;

  // Modo Tercio Inferior (Lower Thirds) para Transmisiones OBS / vMix
  if (slide.mode === 'lowerThird') {
    return (
      <div className="fixed inset-0 flex flex-col justify-end p-6 sm:p-12 pointer-events-none select-none z-50">
        <div
          className={`w-full max-w-5xl mx-auto rounded-2xl p-6 sm:p-8 backdrop-blur-xl border border-amber-500/30 shadow-2xl transition-all duration-300 ${
            slide.theme === 'transparent'
              ? 'bg-black/85 text-white'
              : themeClasses + ' bg-opacity-95'
          }`}
          style={{ transform: `scale(${Math.min(fontScale, 1.15)})` }}
        >
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-wide text-amber-400">
                {slide.title}
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-stone-400">
              {slide.subtitle || 'RVR 1960'}
            </span>
          </div>

          <p className="text-lg sm:text-2xl font-serif leading-relaxed italic text-stone-100">
            “{slide.text}”
          </p>
        </div>
      </div>
    );
  }

  // Modo Pantalla Completa (Full Versículo / Puntos del Sermón)
  return (
    <div
      className={`fixed inset-0 flex flex-col justify-between p-8 sm:p-16 lg:p-24 select-none z-50 overflow-hidden transition-all duration-500 ${themeClasses}`}
    >
      {/* Cabecera Superior: Referencia y Versión */}
      <header className="flex items-center justify-between border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-sans tracking-tight text-amber-400 drop-shadow-sm">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="text-xs sm:text-sm font-sans tracking-wider uppercase text-stone-400 mt-0.5">
                {slide.subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <span>RVR 1960</span>
        </div>
      </header>

      {/* Contenido Central: Texto de la Palabra de Dios con Auto-Escala */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="max-w-6xl w-full text-center">
          <blockquote
            className="font-serif leading-relaxed font-normal tracking-wide text-stone-100 drop-shadow-md select-text"
            style={{
              fontSize: `clamp(1.75rem, ${4.2 * fontScale}vw, ${4.8 * fontScale}rem)`,
              lineHeight: 1.45,
            }}
          >
            {slide.type === 'verse' ? `“${slide.text}”` : slide.text}
          </blockquote>
        </div>
      </main>

      {/* Pie de Página: Firma y Referencia */}
      <footer className="flex items-center justify-between text-xs sm:text-sm text-stone-500 font-sans border-t border-amber-500/10 pt-3">
        <span>Biblia Reina-Valera 1960 • SoyJhery</span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-amber-500/70">{slide.reference || slide.title}</span>
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1 rounded text-stone-500 hover:text-amber-400 transition-colors"
            title="Pantalla Completa (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
};
