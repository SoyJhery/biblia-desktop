import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Reader } from './components/Reader';
import { NavigationModal } from './components/NavigationModal';
import { VerseActionBar } from './components/VerseActionBar';
import { CollectionsModal } from './components/CollectionsModal';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { VerseCardModal } from './components/VerseCardModal';
import { StudyNotebook } from './components/StudyNotebook';

import { bibleService } from './services/bibleService';
import { storageService, initialData, BibleUserData } from './services/storageService';
import { HighlightColor, UserSettings, CollectionItem, StudyNote, LinkedVerse } from './types';

export const App: React.FC = () => {
  const books = useMemo(() => bibleService.getBooks(), []);
  const [userData, setUserData] = useState<BibleUserData>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  const [currentBookId, setCurrentBookId] = useState<number>(1);
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [targetVerseToScroll, setTargetVerseToScroll] = useState<number | null>(null);

  // Modales
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Selección pendiente para el modal de grupos
  const [pendingSelection, setPendingSelection] = useState<{
    bookId: number;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    isFullChapter?: boolean;
    textSnippet?: string;
  } | null>(null);

  // Cargar datos persistidos
  useEffect(() => {
    storageService.load().then((data) => {
      setUserData(data);
      if (data.settings?.lastRead) {
        setCurrentBookId(data.settings.lastRead.bookId || 1);
        setCurrentChapter(data.settings.lastRead.chapter || 1);
        if (data.settings.lastRead.verse) {
          setTargetVerseToScroll(data.settings.lastRead.verse);
        }
      }
      setIsLoaded(true);
    });
  }, []);

  // Actualizar tema en la etiqueta <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'sepia');
    if (userData.settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (userData.settings.theme === 'sepia') {
      root.classList.add('sepia');
    }
  }, [userData.settings.theme]);

  // Persistir último capítulo leído al cambiar
  const saveLastRead = useCallback((bookId: number, chapter: number, verse?: number) => {
    setUserData((prev) => {
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          lastRead: { bookId, chapter, verse },
        },
      };
      storageService.save(updated);
      return updated;
    });
  }, []);

  const currentBook = useMemo(() => {
    return bibleService.getBook(currentBookId) || books[0];
  }, [books, currentBookId]);

  const currentVerses = useMemo(() => {
    return bibleService.getChapterVerses(currentBookId, currentChapter);
  }, [currentBookId, currentChapter]);

  // Navegación de capítulos
  const canPrev = currentBookId > 1 || currentChapter > 1;
  const canNext = currentBookId < 66 || currentChapter < currentBook.chaptersCount;

  const handlePrevChapter = useCallback(() => {
    setSelectedVerses([]);
    if (currentChapter > 1) {
      setCurrentChapter((c) => c - 1);
      saveLastRead(currentBookId, currentChapter - 1);
    } else if (currentBookId > 1) {
      const prevBook = bibleService.getBook(currentBookId - 1);
      if (prevBook) {
        setCurrentBookId(prevBook.id);
        setCurrentChapter(prevBook.chaptersCount);
        saveLastRead(prevBook.id, prevBook.chaptersCount);
      }
    }
  }, [currentBookId, currentChapter, saveLastRead]);

  const handleNextChapter = useCallback(() => {
    setSelectedVerses([]);
    if (currentChapter < currentBook.chaptersCount) {
      setCurrentChapter((c) => c + 1);
      saveLastRead(currentBookId, currentChapter + 1);
    } else if (currentBookId < 66) {
      const nextBook = bibleService.getBook(currentBookId + 1);
      if (nextBook) {
        setCurrentBookId(nextBook.id);
        setCurrentChapter(1);
        saveLastRead(nextBook.id, 1);
      }
    }
  }, [currentBook, currentBookId, currentChapter, saveLastRead]);

  const handleSelectChapter = useCallback((bookId: number, chapter: number) => {
    setSelectedVerses([]);
    setCurrentBookId(bookId);
    setCurrentChapter(chapter);
    saveLastRead(bookId, chapter);
  }, [saveLastRead]);

  const handleJumpToReference = useCallback((bookId: number, chapter: number, verse?: number) => {
    setSelectedVerses([]);
    setCurrentBookId(bookId);
    setCurrentChapter(chapter);
    if (verse) {
      setTargetVerseToScroll(verse);
    }
    saveLastRead(bookId, chapter, verse);
  }, [saveLastRead]);

  // Selección de versículos
  const handleToggleVerseSelection = useCallback((verseNumber: number, shiftKey?: boolean) => {
    setSelectedVerses((prev) => {
      if (shiftKey && prev.length > 0) {
        const last = prev[prev.length - 1];
        const start = Math.min(last, verseNumber);
        const end = Math.max(last, verseNumber);
        const range: number[] = [];
        for (let i = start; i <= end; i++) range.push(i);
        return Array.from(new Set([...prev, ...range]));
      }

      if (prev.includes(verseNumber)) {
        return prev.filter((v) => v !== verseNumber);
      } else {
        return [...prev, verseNumber].sort((a, b) => a - b);
      }
    });
  }, []);

  // Favoritos
  const isAllFavorite = useMemo(() => {
    if (selectedVerses.length === 0) return false;
    return selectedVerses.every((v) => !!userData.favorites[`${currentBookId}-${currentChapter}-${v}`]);
  }, [selectedVerses, userData.favorites, currentBookId, currentChapter]);

  const handleToggleFavorites = useCallback(() => {
    setUserData((prev) => {
      const updatedFavs = { ...prev.favorites };
      const allFav = selectedVerses.every((v) => !!updatedFavs[`${currentBookId}-${currentChapter}-${v}`]);

      selectedVerses.forEach((v) => {
        const id = `${currentBookId}-${currentChapter}-${v}`;
        if (allFav) {
          delete updatedFavs[id];
        } else {
          const text = bibleService.getVerse(currentBookId, currentChapter, v) || '';
          updatedFavs[id] = {
            id,
            bookId: currentBookId,
            chapter: currentChapter,
            verse: v,
            text,
            createdAt: new Date().toISOString(),
          };
        }
      });

      const updated = { ...prev, favorites: updatedFavs };
      storageService.save(updated);
      return updated;
    });
  }, [selectedVerses, currentBookId, currentChapter]);

  const handleRemoveFavorite = useCallback((id: string) => {
    setUserData((prev) => {
      const updatedFavs = { ...prev.favorites };
      delete updatedFavs[id];
      const updated = { ...prev, favorites: updatedFavs };
      storageService.save(updated);
      return updated;
    });
  }, []);

  // Resaltado de color
  const handleHighlight = useCallback((color: HighlightColor | null) => {
    setUserData((prev) => {
      const updatedHls = { ...prev.highlights };
      selectedVerses.forEach((v) => {
        const id = `${currentBookId}-${currentChapter}-${v}`;
        if (!color) {
          delete updatedHls[id];
        } else {
          updatedHls[id] = {
            id,
            bookId: currentBookId,
            chapter: currentChapter,
            verse: v,
            color,
            createdAt: new Date().toISOString(),
          };
        }
      });
      const updated = { ...prev, highlights: updatedHls };
      storageService.save(updated);
      return updated;
    });
    setSelectedVerses([]);
  }, [selectedVerses, currentBookId, currentChapter]);

  // Marcadores
  const handleAddBookmark = useCallback((bookId: number, chapter: number, verse: number, label: string, note?: string) => {
    setUserData((prev) => {
      const newBm = {
        id: `bm-${Date.now()}`,
        bookId,
        chapter,
        verse,
        label,
        note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = { ...prev, bookmarks: [newBm, ...prev.bookmarks] };
      storageService.save(updated);
      return updated;
    });
  }, []);

  const handleDeleteBookmark = useCallback((id: string) => {
    setUserData((prev) => {
      const updated = { ...prev, bookmarks: prev.bookmarks.filter((b) => b.id !== id) };
      storageService.save(updated);
      return updated;
    });
  }, []);

  // Colecciones / Grupos
  const handleCreateCollection = useCallback((name: string, description: string, color: string): string => {
    const newId = `col-${Date.now()}`;
    setUserData((prev) => {
      const newCol = {
        id: newId,
        name,
        description,
        color,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = { ...prev, collections: [...prev.collections, newCol] };
      storageService.save(updated);
      return updated;
    });
    return newId;
  }, []);

  const handleDeleteCollection = useCallback((collectionId: string) => {
    setUserData((prev) => {
      const updated = { ...prev, collections: prev.collections.filter((c) => c.id !== collectionId) };
      storageService.save(updated);
      return updated;
    });
  }, []);

  const handleAddItemToCollection = useCallback((
    collectionId: string,
    item: Omit<CollectionItem, 'id' | 'collectionId' | 'addedAt'>
  ) => {
    setUserData((prev) => {
      const updatedCols = prev.collections.map((col) => {
        if (col.id === collectionId) {
          const newItem: CollectionItem = {
            ...item,
            id: `item-${Date.now()}`,
            collectionId,
            addedAt: new Date().toISOString(),
          };
          return {
            ...col,
            items: [newItem, ...col.items],
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      const updated = { ...prev, collections: updatedCols };
      storageService.save(updated);
      return updated;
    });
  }, []);

  const handleRemoveItemFromCollection = useCallback((collectionId: string, itemId: string) => {
    setUserData((prev) => {
      const updatedCols = prev.collections.map((col) => {
        if (col.id === collectionId) {
          return {
            ...col,
            items: col.items.filter((it) => it.id !== itemId),
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      const updated = { ...prev, collections: updatedCols };
      storageService.save(updated);
      return updated;
    });
  }, []);

  const handleUpdateItemNote = useCallback((collectionId: string, itemId: string, note: string) => {
    setUserData((prev) => {
      const updatedCols = prev.collections.map((col) => {
        if (col.id === collectionId) {
          return {
            ...col,
            items: col.items.map((it) => (it.id === itemId ? { ...it, note } : it)),
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      const updated = { ...prev, collections: updatedCols };
      storageService.save(updated);
      return updated;
    });
  }, []);

  // Abrir modal de agrupación desde la selección
  const handleOpenAddToCollection = () => {
    if (selectedVerses.length === 0) return;
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const vStart = sorted[0];
    const vEnd = sorted[sorted.length - 1];
    const snippet = currentVerses[vStart - 1] || '';

    setPendingSelection({
      bookId: currentBookId,
      chapter: currentChapter,
      verseStart: vStart,
      verseEnd: vEnd,
      isFullChapter: false,
      textSnippet: snippet.length > 90 ? `${snippet.slice(0, 90)}...` : snippet,
    });
    setIsCollectionsOpen(true);
  };

  // Copiar versículos
  const handleCopySelection = () => {
    if (selectedVerses.length === 0) return;
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const quote = bibleService.formatQuote(
      currentBookId,
      currentChapter,
      sorted[0],
      sorted[sorted.length - 1]
    );
    navigator.clipboard.writeText(quote);
  };

  // Texto y referencia seleccionados para diseñar tarjeta
  const selectedCardData = useMemo(() => {
    if (selectedVerses.length === 0) return { text: '', ref: '' };
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const versesList: string[] = [];
    for (let v = sorted[0]; v <= sorted[sorted.length - 1]; v++) {
      const t = currentVerses[v - 1];
      if (t) versesList.push(t);
    }
    return {
      text: versesList.join(' '),
      ref: bibleService.formatReference(currentBookId, currentChapter, sorted[0], sorted[sorted.length - 1]),
    };
  }, [selectedVerses, currentVerses, currentBookId, currentChapter]);

  // Ajustes de lectura
  const handleUpdateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setUserData((prev) => {
      const updated = {
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      };
      storageService.save(updated);
      return updated;
    });
  }, []);

  const handleToggleTheme = () => {
    const currentTheme = userData.settings.theme;
    const nextTheme = currentTheme === 'dark' ? 'sepia' : currentTheme === 'sepia' ? 'light' : 'dark';
    handleUpdateSettings({ theme: nextTheme });
  };

  // Cuaderno de Estudio y Bosquejos
  const handleToggleNotebook = useCallback(() => {
    setIsNotebookOpen((prev) => !prev);
  }, []);

  const handleSelectNote = useCallback((id: string | null) => {
    setActiveNoteId(id);
  }, []);

  const handleCreateNote = useCallback((title?: string, initialVerses?: LinkedVerse[], initialSnippet?: string, initialRef?: string) => {
    let initialHtml = `<h1>${title || 'Nuevo Bosquejo de Estudio'}</h1><p><br></p>`;
    if (initialSnippet && initialRef) {
      initialHtml += `
        <div class="verse-box" contenteditable="false">
          <div class="verse-text">“${initialSnippet}”</div>
          <div class="verse-ref">📖 ${initialRef} — Reina-Valera 1960</div>
        </div>
        <p><br></p>
      `;
    }

    const newNote: StudyNote = {
      id: `note-${Date.now()}`,
      title: title || 'Nuevo Bosquejo de Estudio',
      content: initialHtml,
      tags: ['Estudio'],
      linkedVerses: initialVerses || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUserData((prev) => {
      const updated = {
        ...prev,
        notes: [newNote, ...(prev.notes || [])],
      };
      storageService.save(updated);
      return updated;
    });

    setActiveNoteId(newNote.id);
    setIsNotebookOpen(true);
    return newNote.id;
  }, []);

  const handleUpdateNote = useCallback((updatedNote: StudyNote) => {
    setUserData((prev) => {
      const notes = (prev.notes || []).map((n) => (n.id === updatedNote.id ? updatedNote : n));
      const updated = {
        ...prev,
        notes,
      };
      storageService.save(updated);
      return updated;
    });
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setUserData((prev) => {
      const notes = (prev.notes || []).filter((n) => n.id !== id);
      const updated = {
        ...prev,
        notes,
      };
      storageService.save(updated);
      return updated;
    });

    setActiveNoteId((prevId) => {
      if (prevId === id) {
        const remaining = (userData.notes || []).filter((n) => n.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return prevId;
    });
  }, [userData.notes]);

  const handleSendSelectionToNotebook = useCallback(() => {
    if (selectedVerses.length === 0) return;

    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const vStart = sorted[0];
    const vEnd = sorted[sorted.length - 1];
    const ref = bibleService.formatReference(currentBookId, currentChapter, vStart, vEnd);

    const versesList: string[] = [];
    for (let v = vStart; v <= vEnd; v++) {
      const t = currentVerses[v - 1];
      if (t) versesList.push(`${v}. ${t}`);
    }
    const snippet = versesList.join(' ');

    const newLink: LinkedVerse = {
      id: `link-${Date.now()}`,
      bookId: currentBookId,
      chapter: currentChapter,
      verseStart: vStart,
      verseEnd: vEnd > vStart ? vEnd : undefined,
      reference: ref,
      textSnippet: snippet.slice(0, 120),
    };

    const visualCardHtml = `
      <div class="verse-box" contenteditable="false">
        <div class="verse-text">“${snippet}”</div>
        <div class="verse-ref">📖 ${ref} — Reina-Valera 1960</div>
      </div>
      <p><br></p>
    `;

    const active = (userData.notes || []).find((n) => n.id === activeNoteId);
    if (active) {
      const alreadyLinked = active.linkedVerses?.some(
        (lv) => lv.bookId === currentBookId && lv.chapter === currentChapter && lv.verseStart === vStart
      );
      const updatedLinked = alreadyLinked ? active.linkedVerses : [...(active.linkedVerses || []), newLink];

      handleUpdateNote({
        ...active,
        content: (active.content || '') + visualCardHtml,
        linkedVerses: updatedLinked,
        updatedAt: new Date().toISOString(),
      });
      setIsNotebookOpen(true);
    } else {
      handleCreateNote(`Estudio: ${ref}`, [newLink], snippet, ref);
    }

    setSelectedVerses([]);
  }, [selectedVerses, currentBookId, currentChapter, currentVerses, userData.notes, activeNoteId, handleUpdateNote, handleCreateNote]);

  // Atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsNotebookOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedVerses([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-950 text-stone-300">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Cargando Sagradas Escrituras...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors">
      {/* Header */}
      <Header
        currentBook={currentBook}
        currentChapter={currentChapter}
        onOpenNavigation={() => setIsNavOpen(true)}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        canPrev={canPrev}
        canNext={canNext}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCollections={() => setIsCollectionsOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={userData.settings.theme}
        onToggleTheme={handleToggleTheme}
        favoritesCount={Object.keys(userData.favorites).length}
        bookmarksCount={userData.bookmarks.length}
        collectionsCount={userData.collections.length}
        isNotebookOpen={isNotebookOpen}
        onToggleNotebook={handleToggleNotebook}
        notesCount={(userData.notes || []).length}
      />

      {/* Main Workspace: Split-View Bible Reader + Study Notebook */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Reader
            currentBook={currentBook}
            currentChapter={currentChapter}
            verses={currentVerses}
            settings={userData.settings}
            highlights={userData.highlights}
            favorites={userData.favorites}
            bookmarks={userData.bookmarks}
            collections={userData.collections}
            selectedVerses={selectedVerses}
            onToggleVerseSelection={handleToggleVerseSelection}
            targetVerseToScroll={targetVerseToScroll}
            onClearTargetVerse={() => setTargetVerseToScroll(null)}
            onPrevChapter={handlePrevChapter}
            onNextChapter={handleNextChapter}
            canPrev={canPrev}
            canNext={canNext}
          />
        </div>

        {/* Cuaderno de Estudio y Bosquejos (Pantalla Dividida) */}
        <StudyNotebook
          isOpen={isNotebookOpen}
          onClose={() => setIsNotebookOpen(false)}
          notes={userData.notes || []}
          activeNoteId={activeNoteId}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onJumpToReference={handleJumpToReference}
          currentBookName={currentBook.name}
          currentBookId={currentBookId}
          currentChapter={currentChapter}
          selectedVerses={selectedVerses}
          currentChapterVerses={currentVerses.map((text, idx) => ({ verse: idx + 1, text }))}
        />
      </div>

      {/* Floating Action Bar */}
      <VerseActionBar
        selectedVerses={selectedVerses}
        bookName={currentBook.name}
        chapter={currentChapter}
        onClearSelection={() => setSelectedVerses([])}
        onToggleFavorites={handleToggleFavorites}
        isAllFavorite={isAllFavorite}
        onHighlight={handleHighlight}
        onAddToCollection={handleOpenAddToCollection}
        onOpenCardStudio={() => setIsCardModalOpen(true)}
        onSendToNotebook={handleSendSelectionToNotebook}
        onBookmark={() => {
          if (selectedVerses.length > 0) {
            handleAddBookmark(
              currentBookId,
              currentChapter,
              selectedVerses[0],
              `Marcador en ${currentBook.name} ${currentChapter}:${selectedVerses[0]}`
            );
            setSelectedVerses([]);
          }
        }}
        onCopy={handleCopySelection}
      />

      {/* Verse Card Studio Modal (Creador de Imágenes para Redes de SoyJhery) */}
      <VerseCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        verseText={selectedCardData.text}
        reference={selectedCardData.ref}
      />

      {/* Modals & Drawers */}
      <NavigationModal
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        books={books}
        currentBook={currentBook}
        currentChapter={currentChapter}
        onSelectChapter={handleSelectChapter}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentBook={currentBook}
        onSelectVerse={(bId, ch, v) => handleJumpToReference(bId, ch, v)}
      />

      <CollectionsModal
        isOpen={isCollectionsOpen}
        onClose={() => {
          setIsCollectionsOpen(false);
          setPendingSelection(null);
        }}
        collections={userData.collections}
        onCreateCollection={handleCreateCollection}
        onDeleteCollection={handleDeleteCollection}
        onAddItemToCollection={handleAddItemToCollection}
        onRemoveItemFromCollection={handleRemoveItemFromCollection}
        onUpdateItemNote={handleUpdateItemNote}
        onJumpToReference={handleJumpToReference}
        currentBook={currentBook}
        currentChapter={currentChapter}
        pendingSelection={pendingSelection}
        onClearPendingSelection={() => setPendingSelection(null)}
      />

      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={userData.bookmarks}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onJumpToReference={handleJumpToReference}
        currentBook={currentBook}
        currentChapter={currentChapter}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={userData.favorites}
        onRemoveFavorite={handleRemoveFavorite}
        onJumpToReference={handleJumpToReference}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userData.settings}
        onUpdateSettings={handleUpdateSettings}
        onExportBackup={() => storageService.exportBackup()}
        onImportBackup={async () => {
          const res = await storageService.importBackup();
          if (res.success && res.data) {
            setUserData(res.data);
          }
        }}
        onResetData={() => {
          if (confirm('¿Deseas restablecer todos tus favoritos, marcadores y grupos a los valores predeterminados?')) {
            setUserData(initialData);
            storageService.save(initialData);
          }
        }}
      />
    </div>
  );
};
export default App;
