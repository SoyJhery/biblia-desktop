import React from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FolderPlus, 
  Bookmark as BookmarkIcon, 
  Star, 
  Sliders, 
  Sun, 
  Moon, 
  Coffee 
} from 'lucide-react';
import { Book, ThemeMode } from '../types';

interface HeaderProps {
  currentBook: Book;
  currentChapter: number;
  onOpenNavigation: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  canPrev: boolean;
  canNext: boolean;
  onOpenSearch: () => void;
  onOpenCollections: () => void;
  onOpenBookmarks: () => void;
  onOpenFavorites: () => void;
  onOpenSettings: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  favoritesCount: number;
  bookmarksCount: number;
  collectionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentBook,
  currentChapter,
  onOpenNavigation,
  onPrevChapter,
  onNextChapter,
  canPrev,
  canNext,
  onOpenSearch,
  onOpenCollections,
  onOpenBookmarks,
  onOpenFavorites,
  onOpenSettings,
  theme,
  onToggleTheme,
  favoritesCount,
  bookmarksCount,
  collectionsCount,
}) => {
  return (
    <header className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none transition-colors">
      {/* Brand & Chapter Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold tracking-wide">
          <BookOpen className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-bold tracking-tight">RVR 1960</span>
        </div>

        <div className="h-4 w-[1px] bg-stone-300 dark:bg-stone-700 hidden sm:block" />

        {/* Navigation Dropdown Button */}
        <button
          onClick={onOpenNavigation}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-medium text-sm transition-all shadow-sm active:scale-95 border border-stone-200 dark:border-stone-700"
          title="Cambiar libro o capítulo"
        >
          <span className="font-semibold text-amber-700 dark:text-amber-400">{currentBook.name}</span>
          <span className="text-stone-500 dark:text-stone-400">Cap. {currentChapter}</span>
          <span className="text-xs text-stone-400">▾</span>
        </button>

        {/* Prev / Next chapter quick arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevChapter}
            disabled={!canPrev}
            className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none text-stone-600 dark:text-stone-300 transition-colors"
            title="Capítulo anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextChapter}
            disabled={!canNext}
            className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none text-stone-600 dark:text-stone-300 transition-colors"
            title="Capítulo siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons & Utilities */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors"
          title="Buscar versículos (Ctrl+F)"
        >
          <Search className="w-4 h-4 text-stone-500" />
          <span className="hidden md:inline">Buscar</span>
        </button>

        {/* Collections / Groups */}
        <button
          onClick={onOpenCollections}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors"
          title="Grupos de estudio y temas"
        >
          <FolderPlus className="w-4 h-4 text-amber-500" />
          <span className="hidden md:inline">Grupos</span>
          {collectionsCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
              {collectionsCount}
            </span>
          )}
        </button>

        {/* Bookmarks */}
        <button
          onClick={onOpenBookmarks}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors"
          title="Marcadores de lectura"
        >
          <BookmarkIcon className="w-4 h-4 text-blue-500" />
          <span className="hidden lg:inline">Marcadores</span>
          {bookmarksCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
              {bookmarksCount}
            </span>
          )}
        </button>

        {/* Favorites */}
        <button
          onClick={onOpenFavorites}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors"
          title="Versículos favoritos"
        >
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="hidden lg:inline">Favoritos</span>
          {favoritesCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold">
              {favoritesCount}
            </span>
          )}
        </button>

        <div className="h-4 w-[1px] bg-stone-200 dark:bg-stone-800 mx-1" />

        {/* Quick Theme Cycle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
          title={`Tema actual: ${theme}. Clic para alternar (Oscuro / Sepia / Claro)`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-amber-400" />
          ) : theme === 'sepia' ? (
            <Coffee className="w-4 h-4 text-amber-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
          title="Ajustes tipográficos y opciones"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
