import React, { useState } from 'react';
import { Star, Highlighter, FolderPlus, Bookmark, Copy, X, Check, Sparkles, FileText, Languages } from 'lucide-react';
import { HighlightColor } from '../types';

interface VerseActionBarProps {
  selectedVerses: number[];
  bookName: string;
  chapter: number;
  onClearSelection: () => void;
  onToggleFavorites: () => void;
  isAllFavorite: boolean;
  onHighlight: (color: HighlightColor | null) => void;
  onAddToCollection: () => void;
  onOpenCardStudio: () => void;
  onSendToNotebook?: () => void;
  onOpenLexicon?: () => void;
  onBookmark: () => void;
  onCopy: () => void;
}

const HIGHLIGHT_COLORS: { color: HighlightColor; hex: string; label: string }[] = [
  { color: 'yellow', hex: '#facc15', label: 'Amarillo' },
  { color: 'green', hex: '#4ade80', label: 'Verde' },
  { color: 'blue', hex: '#60a5fa', label: 'Azul' },
  { color: 'purple', hex: '#c084fc', label: 'Púrpura' },
  { color: 'orange', hex: '#fb923c', label: 'Naranja' },
];

export const VerseActionBar: React.FC<VerseActionBarProps> = ({
  selectedVerses,
  bookName,
  chapter,
  onClearSelection,
  onToggleFavorites,
  isAllFavorite,
  onHighlight,
  onAddToCollection,
  onOpenCardStudio,
  onSendToNotebook,
  onOpenLexicon,
  onBookmark,
  onCopy,
}) => {
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [copied, setCopied] = useState(false);

  if (selectedVerses.length === 0) return null;

  const sorted = [...selectedVerses].sort((a, b) => a - b);
  const rangeStr =
    sorted.length === 1
      ? `${sorted[0]}`
      : `${sorted[0]}-${sorted[sorted.length - 1]}`;

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up flex flex-col items-center">
      {/* Color Palette Popover */}
      {showColorPalette && (
        <div className="mb-2 p-2 rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2 animate-fade-in">
          {HIGHLIGHT_COLORS.map(({ color, hex, label }) => (
            <button
              key={color}
              onClick={() => {
                onHighlight(color);
                setShowColorPalette(false);
              }}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95 shadow-sm border border-black/10"
              style={{ backgroundColor: hex }}
              title={`Resaltar ${label}`}
            />
          ))}
          <div className="w-[1px] h-5 bg-stone-300 dark:bg-stone-700 mx-1" />
          <button
            onClick={() => {
              onHighlight(null);
              setShowColorPalette(false);
            }}
            className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium"
            title="Quitar resaltado"
          >
            Quitar
          </button>
        </div>
      )}

      {/* Main Floating Bar */}
      <div className="px-4 py-2.5 rounded-2xl bg-stone-900/95 dark:bg-stone-850/95 text-white shadow-2xl backdrop-blur-md border border-stone-700/60 flex items-center gap-3 text-xs font-medium">
        {/* Selection Badge */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-stone-700">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-stone-200">
            {bookName} {chapter}:{rangeStr}
          </span>
          <span className="text-[11px] text-stone-400">({selectedVerses.length})</span>
        </div>

        {/* Favorite */}
        <button
          onClick={onToggleFavorites}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
            isAllFavorite
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'hover:bg-stone-800 text-stone-300'
          }`}
          title={isAllFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Star className={`w-3.5 h-3.5 ${isAllFavorite ? 'fill-yellow-400' : ''}`} />
          <span className="hidden sm:inline">Favorito</span>
        </button>

        {/* Highlight */}
        <button
          onClick={() => setShowColorPalette(!showColorPalette)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-300 transition-colors"
          title="Resaltar con color"
        >
          <Highlighter className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Resaltar</span>
        </button>

        {/* Add to Collection / Group */}
        <button
          onClick={onAddToCollection}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition-colors"
          title="Agregar a un grupo de estudio o carpeta"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Agrupar</span>
        </button>

        {/* Crear Tarjeta / Imagen para Redes */}
        <button
          onClick={onOpenCardStudio}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 font-semibold transition-all border border-amber-500/30 shadow-xs"
          title="Diseñar imagen para WhatsApp, Instagram o Facebook"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Crear Imagen</span>
        </button>

        {/* Send to Study Notebook */}
        {onSendToNotebook && (
          <button
            onClick={onSendToNotebook}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold transition-all border border-emerald-500/30 shadow-xs"
            title="Añadir pasaje al Cuaderno de Estudio / Bosquejo"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">A Nota</span>
          </button>
        )}

        {/* Referencias Cruzadas & Léxico Strong */}
        {onOpenLexicon && (
          <button
            onClick={onOpenLexicon}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-semibold transition-all border border-indigo-500/30 shadow-xs"
            title="Ver referencias cruzadas bíblicas (TSK) y léxico Strong"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Referencias</span>
          </button>
        )}

        {/* Bookmark */}
        <button
          onClick={onBookmark}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-300 transition-colors"
          title="Crear marcador de lectura"
        >
          <Bookmark className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Marcar</span>
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-300 transition-colors"
          title="Copiar versículos con cita"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
        </button>

        {/* Deselect */}
        <button
          onClick={onClearSelection}
          className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors ml-1"
          title="Cerrar selección"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
