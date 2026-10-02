export type Testament = 'Antiguo Testamento' | 'Nuevo Testamento';

export interface Book {
  id: number;
  name: string;
  abbrev: string;
  testament: Testament;
  category: string;
  chaptersCount: number;
  versesCount: number;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple' | 'orange';

export interface Highlight {
  id: string; // formato "bookId-chapter-verse", ej: "1-1-1"
  bookId: number;
  chapter: number;
  verse: number;
  color: HighlightColor;
  createdAt: string;
}

export interface Favorite {
  id: string; // "bookId-chapter-verse"
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  bookId: number;
  chapter: number;
  verse?: number;
  label: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  isFullChapter?: boolean;
  textSnippet?: string;
  note?: string;
  addedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string; // Color distintivo para tag o badge
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'dark' | 'light' | 'sepia';
export type ReaderFont = 'serif' | 'sans';

export interface UserSettings {
  theme: ThemeMode;
  fontSize: number; // en px (ej: 18)
  fontFamily: ReaderFont;
  lineHeight: number; // ej: 1.8
  showVerseNumbers: boolean;
  lastRead: {
    bookId: number;
    chapter: number;
    verse?: number;
  };
}

export interface SearchResult {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface LinkedVerse {
  id: string;
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  reference: string;
  textSnippet: string;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string; // Texto enriquecido o markdown del sermón o estudio
  tags: string[];
  linkedVerses: LinkedVerse[];
  createdAt: string;
  updatedAt: string;
}

