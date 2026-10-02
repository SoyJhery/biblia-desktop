import React, { useState } from 'react';
import { X, Bookmark as BookmarkIcon, Trash2, BookOpen, Plus, Clock } from 'lucide-react';
import { Bookmark, Book } from '../types';
import { bibleService } from '../services/bibleService';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onAddBookmark: (bookId: number, chapter: number, verse: number, label: string, note?: string) => void;
  onDeleteBookmark: (id: string) => void;
  onJumpToReference: (bookId: number, chapter: number, verse?: number) => void;
  currentBook: Book;
  currentChapter: number;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  onJumpToReference,
  currentBook,
  currentChapter,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim() || `Lectura en ${currentBook.name} ${currentChapter}`;
    onAddBookmark(currentBook.id, currentChapter, 1, label, newNote.trim() || undefined);
    setNewLabel('');
    setNewNote('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md h-full bg-white dark:bg-stone-900 shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-base font-bold">Marcadores de Lectura</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Puntos guardados para retomar tu lectura
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

        {/* Quick Add Current Bookmark Button */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-850/50">
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Marcar posición actual ({currentBook.name} {currentChapter})</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-col gap-2">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                Nuevo Marcador en {currentBook.name} {currentChapter}
              </span>
              <input
                type="text"
                placeholder="Etiqueta (ej: Lectura nocturna, Plan anual)..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Nota opcional..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 outline-none"
              />
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 py-1 text-xs text-stone-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  Guardar Marcador
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {bookmarks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <BookmarkIcon className="w-10 h-10 mb-2 stroke-1 opacity-40" />
              <p className="text-sm font-medium">No tienes marcadores guardados</p>
              <p className="text-xs text-stone-500 mt-1">
                Usa el botón superior o selecciona un versículo para recordar por dónde vas.
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => {
              const book = bibleService.getBook(bm.bookId);
              const ref = `${book?.name || 'Libro'} ${bm.chapter}${bm.verse ? `:${bm.verse}` : ''}`;
              return (
                <div
                  key={bm.id}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/60 hover:border-blue-400 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">{bm.label}</span>
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-colors"
                      title="Eliminar marcador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      {ref}
                    </span>
                    <button
                      onClick={() => {
                        onJumpToReference(bm.bookId, bm.chapter, bm.verse);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Continuar</span>
                    </button>
                  </div>

                  {bm.note && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 italic mt-0.5">
                      "{bm.note}"
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Guardado: {new Date(bm.updatedAt || bm.createdAt).toLocaleDateString()}</span>
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
