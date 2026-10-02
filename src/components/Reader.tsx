import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Bookmark, Tag } from 'lucide-react';
import { Book, Collection, Favorite, Highlight, UserSettings } from '../types';

interface ReaderProps {
  currentBook: Book;
  currentChapter: number;
  verses: string[];
  settings: UserSettings;
  highlights: Record<string, Highlight>;
  favorites: Record<string, Favorite>;
  bookmarks: { bookId: number; chapter: number; verse?: number; label: string }[];
  collections: Collection[];
  selectedVerses: number[];
  onToggleVerseSelection: (verseNumber: number, shiftKey?: boolean) => void;
  targetVerseToScroll?: number | null;
  onClearTargetVerse?: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export const Reader: React.FC<ReaderProps> = ({
  currentBook,
  currentChapter,
  verses,
  settings,
  highlights,
  favorites,
  bookmarks,
  collections,
  selectedVerses,
  onToggleVerseSelection,
  targetVerseToScroll,
  onClearTargetVerse,
  onPrevChapter,
  onNextChapter,
  canPrev,
  canNext,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  // Auto-scroll to target verse when jumping from search or favorites
  useEffect(() => {
    if (targetVerseToScroll && verseRefs.current[targetVerseToScroll]) {
      const el = verseRefs.current[targetVerseToScroll];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('flash-verse');
      const timer = setTimeout(() => {
        el?.classList.remove('flash-verse');
        if (onClearTargetVerse) onClearTargetVerse();
      }, 2500);
      return () => clearTimeout(timer);
    } else if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentBook.id, currentChapter, targetVerseToScroll]);

  // Find collections that reference this chapter or verses in this chapter
  const getCollectionsForVerse = (vNum: number): Collection[] => {
    return collections.filter((c) =>
      c.items.some(
        (item) =>
          item.bookId === currentBook.id &&
          item.chapter === currentChapter &&
          (item.isFullChapter ||
            (vNum >= item.verseStart && vNum <= (item.verseEnd || item.verseStart)))
      )
    );
  };

  const fontFamilyClass = settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 md:px-12 py-8 scroll-smooth select-text"
    >
      <div className="max-w-3xl mx-auto">
        {/* Chapter Header Banner */}
        <div className="text-center pb-8 mb-8 border-b border-stone-200 dark:border-stone-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{currentBook.testament}</span>
            <span>•</span>
            <span>{currentBook.category}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-serif text-stone-900 dark:text-stone-50">
            {currentBook.name}
          </h1>

          <p className="mt-2 text-lg text-stone-500 dark:text-stone-400 font-medium">
            Capítulo {currentChapter}
          </p>

          {/* Top Quick Navigation */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold">
            <button
              onClick={onPrevChapter}
              disabled={!canPrev}
              className="flex items-center gap-1 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Capítulo anterior</span>
            </button>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <button
              onClick={onNextChapter}
              disabled={!canNext}
              className="flex items-center gap-1 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span>Capítulo siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Biblical Text Verses */}
        <div 
          className={`leading-relaxed ${fontFamilyClass}`}
          style={{ 
            fontSize: `${settings.fontSize}px`, 
            lineHeight: settings.lineHeight 
          }}
        >
          {verses.map((verseText, index) => {
            const verseNumber = index + 1;
            const verseId = `${currentBook.id}-${currentChapter}-${verseNumber}`;
            const highlight = highlights[verseId];
            const isFavorite = !!favorites[verseId];
            const isBookmarked = bookmarks.some(
              (b) => b.bookId === currentBook.id && b.chapter === currentChapter && b.verse === verseNumber
            );
            const verseCollections = getCollectionsForVerse(verseNumber);
            const isSelected = selectedVerses.includes(verseNumber);

            let highlightClass = '';
            if (highlight) {
              highlightClass = `hl-${highlight.color}`;
            }

            return (
              <span
                key={verseNumber}
                ref={(el) => {
                  verseRefs.current[verseNumber] = el;
                }}
                onClick={(e) => onToggleVerseSelection(verseNumber, e.shiftKey)}
                className={`inline rounded transition-all cursor-pointer relative group px-1 py-0.5 mx-0.5 ${highlightClass} ${
                  isSelected
                    ? 'ring-2 ring-amber-500 bg-amber-500/20 rounded-md font-medium'
                    : 'hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
                }`}
                title={`Haz clic para seleccionar (${currentBook.name} ${currentChapter}:${verseNumber})`}
              >
                {/* Verse Number */}
                {settings.showVerseNumbers && (
                  <sup className="font-sans font-bold text-[0.68em] text-amber-700 dark:text-amber-400 mr-1 select-none opacity-80 group-hover:opacity-100">
                    {verseNumber}
                  </sup>
                )}

                {/* Verse Text */}
                <span>{verseText}</span>

                {/* Status Badges */}
                {(isFavorite || isBookmarked || verseCollections.length > 0) && (
                  <span className="inline-flex items-center gap-0.5 ml-1 select-none align-middle">
                    {isFavorite && (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 inline" />
                    )}
                    {isBookmarked && (
                      <Bookmark className="w-3 h-3 text-blue-500 fill-blue-500 inline" />
                    )}
                    {verseCollections.map((col) => (
                      <span
                        key={col.id}
                        className="w-2 h-2 rounded-full inline-block border border-white/40 shadow-xs"
                        style={{ backgroundColor: col.color }}
                        title={`En grupo: ${col.name}`}
                      />
                    ))}
                  </span>
                )}
                {' '}
              </span>
            );
          })}
        </div>

        {/* Bottom Chapter Navigation Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 pt-8 mt-12 pb-16">
          <button
            onClick={onPrevChapter}
            disabled={!canPrev}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Capítulo Anterior</span>
          </button>

          <span className="text-xs text-stone-400 font-serif">
            Fin de {currentBook.name} {currentChapter}
          </span>

          <button
            onClick={onNextChapter}
            disabled={!canNext}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          >
            <span>Capítulo Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
