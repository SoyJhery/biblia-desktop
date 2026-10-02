import React, { useState, useEffect, useMemo } from 'react';
import { Search as SearchIcon, X, ArrowRight } from 'lucide-react';
import { Book, Testament } from '../types';
import { bibleService } from '../services/bibleService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book;
  initialQuery?: string;
  onSelectVerse: (bookId: number, chapter: number, verse: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  currentBook,
  initialQuery = '',
  onSelectVerse,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<'all' | 'AT' | 'NT' | 'book'>('all');

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
      }
    } else {
      setQuery('');
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];

    let testament: Testament | undefined;
    if (scope === 'AT') testament = 'Antiguo Testamento';
    if (scope === 'NT') testament = 'Nuevo Testamento';

    const bookId = scope === 'book' ? currentBook.id : undefined;

    return bibleService.searchVerses(query, {
      testament,
      bookId,
      maxResults: 150,
    });
  }, [query, scope, currentBook]);

  if (!isOpen) return null;

  // Resalta la palabra buscada en el texto del resultado
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 dark:bg-amber-500/40 text-inherit font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl h-[80vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3 bg-stone-50/50 dark:bg-stone-900/50">
          <SearchIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por palabra o frase (ej: amor, principio, fe, paz)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm md:text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Filters */}
        <div className="px-6 py-2.5 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-medium mr-1">Ámbito:</span>
            <button
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'all'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Toda la Biblia
            </button>
            <button
              onClick={() => setScope('AT')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'AT'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Antiguo T.
            </button>
            <button
              onClick={() => setScope('NT')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'NT'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Nuevo T.
            </button>
            <button
              onClick={() => setScope('book')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'book'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Solo {currentBook.name}
            </button>
          </div>

          <span className="text-stone-400 font-medium">
            {results.length > 0 ? `${results.length} coincidencias` : ''}
          </span>
        </div>

        {/* Results View */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {query.trim().length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <SearchIcon className="w-10 h-10 mb-2 stroke-1 opacity-40" />
              <p className="text-sm font-medium">Escribe al menos 2 letras para buscar</p>
              <p className="text-xs text-stone-500 mt-1">
                La búsqueda es instantánea y no sensible a mayúsculas ni tildes.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <p className="text-sm font-medium">No se encontraron resultados para "{query}"</p>
              <p className="text-xs text-stone-500 mt-1">Prueba con otra palabra o amplía el ámbito de búsqueda.</p>
            </div>
          ) : (
            results.map((res, i) => (
              <button
                key={`${res.bookId}-${res.chapter}-${res.verse}-${i}`}
                onClick={() => {
                  onSelectVerse(res.bookId, res.chapter, res.verse);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/60 bg-stone-50/50 dark:bg-stone-850/60 hover:bg-white dark:hover:bg-stone-800 text-left transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {res.bookName} {res.chapter}:{res.verse}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
                    {highlightMatch(res.text, query)}
                  </p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-amber-500 flex items-center gap-1 text-xs font-semibold">
                  <span>Ir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
