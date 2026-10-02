import React, { useState, useEffect } from 'react';
import { X, Star, Trash2, BookOpen, Copy, Check, Search } from 'lucide-react';
import { Favorite } from '../types';
import { bibleService } from '../services/bibleService';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Record<string, Favorite>;
  onRemoveFavorite: (verseId: string) => void;
  onJumpToReference: (bookId: number, chapter: number, verse?: number) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onJumpToReference,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const favoritesList = Object.values(favorites).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filtered = favoritesList.filter((fav) => {
    const book = bibleService.getBook(fav.bookId);
    const bookName = book?.name || '';
    const query = filterQuery.toLowerCase();
    return (
      bookName.toLowerCase().includes(query) ||
      fav.text.toLowerCase().includes(query) ||
      `${fav.chapter}:${fav.verse}`.includes(query)
    );
  });

  const handleCopy = (fav: Favorite) => {
    const book = bibleService.getBook(fav.bookId);
    const text = `"${fav.text}" — ${book?.name || 'Libro'} ${fav.chapter}:${fav.verse} (RVR1960)`;
    navigator.clipboard.writeText(text);
    setCopiedId(fav.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full bg-white dark:bg-stone-900 shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <div>
              <h2 className="text-base font-bold">Versículos Favoritos</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {favoritesList.length} pasajes guardados en el corazón
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Input */}
        {favoritesList.length > 5 && (
          <div className="p-3 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-850/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Filtrar favoritos..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 outline-none"
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {favoritesList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Star className="w-10 h-10 mb-2 stroke-1 opacity-40 text-yellow-500" />
              <p className="text-sm font-medium">No has marcado ningún versículo como favorito</p>
              <p className="text-xs text-stone-500 mt-1">
                Haz clic en cualquier versículo durante tu lectura y pulsa el botón de estrella ⭐.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">
              No hay favoritos que coincidan con la búsqueda.
            </div>
          ) : (
            filtered.map((fav) => {
              const book = bibleService.getBook(fav.bookId);
              const ref = `${book?.name || 'Libro'} ${fav.chapter}:${fav.verse}`;
              const isCopied = copiedId === fav.id;

              return (
                <div
                  key={fav.id}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/60 hover:border-yellow-400/60 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-yellow-600 dark:text-yellow-400">
                      {ref}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(fav)}
                        className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                        title="Copiar versículo"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onRemoveFavorite(fav.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-colors"
                        title="Quitar de favoritos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 dark:text-stone-300 font-serif leading-relaxed italic border-l-2 border-yellow-500/40 pl-2">
                    "{fav.text}"
                  </p>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onJumpToReference(fav.bookId, fav.chapter, fav.verse);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-750 hover:bg-yellow-500 hover:text-white dark:hover:bg-yellow-500 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Ir al capítulo</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
