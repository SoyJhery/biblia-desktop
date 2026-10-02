import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, ChevronLeft, ArrowRight } from 'lucide-react';
import { Book, Testament } from '../types';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  currentBook: Book;
  currentChapter: number;
  onSelectChapter: (bookId: number, chapter: number) => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  onClose,
  books,
  currentBook,
  currentChapter,
  onSelectChapter,
}) => {
  const [selectedBook, setSelectedBook] = useState<Book>(currentBook);
  const [step, setStep] = useState<'books' | 'chapters'>('books');
  const [testamentFilter, setTestamentFilter] = useState<'all' | Testament>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sincronizar libro actual al abrir modal
  useEffect(() => {
    if (isOpen) {
      setSelectedBook(currentBook);
      setStep('books');
      setSearchQuery('');
    }
  }, [isOpen, currentBook]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'chapters') {
          setStep('books');
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchTestament = testamentFilter === 'all' || b.testament === testamentFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.abbrev.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTestament && matchSearch;
    });
  }, [books, testamentFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'chapters' && (
              <button
                onClick={() => setStep('books')}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors mr-1"
                title="Volver a lista de libros"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {step === 'books' ? 'Seleccionar Libro' : `${selectedBook.name} — Seleccionar Capítulo`}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {step === 'books' 
                  ? 'Explora el Antiguo y Nuevo Testamento' 
                  : `${selectedBook.testament} • ${selectedBook.chaptersCount} capítulos`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Books Selector */}
        {step === 'books' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search & Testament Filters */}
            <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar libro (ej. Génesis, Mateo, Salmos)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Testament Tabs */}
              <div className="flex rounded-lg bg-stone-200 dark:bg-stone-800 p-0.5 text-xs font-medium w-full sm:w-auto">
                <button
                  onClick={() => setTestamentFilter('all')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all ${
                    testamentFilter === 'all'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  Todos (66)
                </button>
                <button
                  onClick={() => setTestamentFilter('Antiguo Testamento')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all ${
                    testamentFilter === 'Antiguo Testamento'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  Antiguo (39)
                </button>
                <button
                  onClick={() => setTestamentFilter('Nuevo Testamento')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all ${
                    testamentFilter === 'Nuevo Testamento'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  Nuevo (27)
                </button>
              </div>
            </div>

            {/* Books Grid */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredBooks.map((book) => {
                const isCurrent = book.id === currentBook.id;
                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      setSelectedBook(book);
                      setStep('chapters');
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all group ${
                      isCurrent
                        ? 'border-amber-500/80 bg-amber-500/10 dark:bg-amber-500/15 ring-1 ring-amber-500/30'
                        : 'border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {book.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                        {book.abbrev}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                      <span>{book.chaptersCount} caps.</span>
                      <span className="text-[10px] text-stone-400 truncate max-w-[90px]">{book.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Chapters Selector */}
        {step === 'chapters' && (
          <div className="flex flex-col flex-1 overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Haz clic en el número de capítulo para saltar de inmediato:
              </span>
              <button
                onClick={() => {
                  onSelectChapter(selectedBook.id, 1);
                  onClose();
                }}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Ir al Capítulo 1 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 pr-1">
              {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => {
                const isCurrent = selectedBook.id === currentBook.id && ch === currentChapter;
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      onSelectChapter(selectedBook.id, ch);
                      onClose();
                    }}
                    className={`aspect-square flex items-center justify-center rounded-xl font-semibold text-sm transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-105 ring-2 ring-amber-400'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700/60'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
