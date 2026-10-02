import { Book, Testament, SearchResult } from '../types';
import booksData from '../data/books.json';
import versesDataRaw from '../data/bible-verses.json';

const books: Book[] = booksData as Book[];
const versesMap: Record<string, Record<string, string[]>> = versesDataRaw as any;

/**
 * Normaliza una cadena para búsquedas insensibles a mayúsculas y tildes/acentos
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export const bibleService = {
  getBooks(): Book[] {
    return books;
  },

  getBook(bookId: number): Book | undefined {
    return books.find((b) => b.id === bookId);
  },

  getChapterVerses(bookId: number, chapter: number): string[] {
    const bookVerses = versesMap[String(bookId)];
    if (!bookVerses) return [];
    return bookVerses[String(chapter)] || [];
  },

  getVerse(bookId: number, chapter: number, verse: number): string | undefined {
    const chapterVerses = this.getChapterVerses(bookId, chapter);
    return chapterVerses[verse - 1];
  },

  formatReference(bookId: number, chapter: number, verseStart?: number, verseEnd?: number): string {
    const book = this.getBook(bookId);
    const bookName = book ? book.name : `Libro ${bookId}`;
    if (!verseStart) {
      return `${bookName} ${chapter}`;
    }
    if (!verseEnd || verseEnd === verseStart) {
      return `${bookName} ${chapter}:${verseStart}`;
    }
    return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
  },

  formatQuote(bookId: number, chapter: number, verseStart: number, verseEnd?: number): string {
    const ref = this.formatReference(bookId, chapter, verseStart, verseEnd);
    const end = verseEnd || verseStart;
    const lines: string[] = [];
    for (let v = verseStart; v <= end; v++) {
      const text = this.getVerse(bookId, chapter, v);
      if (text) {
        lines.push(`${v}. ${text}`);
      }
    }
    return `"${lines.join(' ')}" — ${ref} (RVR1960)`;
  },

  searchVerses(query: string, options?: { bookId?: number; testament?: Testament; maxResults?: number }): SearchResult[] {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    const normQuery = normalizeText(trimmed);
    const results: SearchResult[] = [];
    const max = options?.maxResults || 200;

    let targetBooks = books;
    if (options?.bookId) {
      targetBooks = books.filter((b) => b.id === options.bookId);
    } else if (options?.testament) {
      targetBooks = books.filter((b) => b.testament === options.testament);
    }

    for (const b of targetBooks) {
      const bookVerses = versesMap[String(b.id)];
      if (!bookVerses) continue;

      for (let ch = 1; ch <= b.chaptersCount; ch++) {
        const list = bookVerses[String(ch)];
        if (!list) continue;

        for (let v = 0; v < list.length; v++) {
          const verseText = list[v];
          if (normalizeText(verseText).includes(normQuery)) {
            results.push({
              bookId: b.id,
              bookName: b.name,
              chapter: ch,
              verse: v + 1,
              text: verseText,
            });
            if (results.length >= max) {
              return results;
            }
          }
        }
      }
    }

    return results;
  },
};
