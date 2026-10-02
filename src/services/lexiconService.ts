import { StrongEntry, CrossReferenceItem, TheologicalTerm, StrongLanguage } from '../types';
import { bibleService } from './bibleService';
import theologicalTermsData from '../data/theological-terms.json';

// Carga perezosa (lazy load) para máxima velocidad de arranque
let strongDictPromise: Promise<Record<string, StrongEntry>> | null = null;
let crossRefPromise: Promise<Record<string, string[]>> | null = null;

let strongDictCache: Record<string, StrongEntry> | null = null;
let crossRefCache: Record<string, string[]> | null = null;

async function getStrongData(): Promise<Record<string, StrongEntry>> {
  if (strongDictCache) return strongDictCache;
  if (!strongDictPromise) {
    strongDictPromise = import('../data/strong-dictionary.json').then((module) => {
      strongDictCache = (module.default || module) as Record<string, StrongEntry>;
      return strongDictCache;
    });
  }
  return strongDictPromise;
}

async function getCrossRefData(): Promise<Record<string, string[]>> {
  if (crossRefCache) return crossRefCache;
  if (!crossRefPromise) {
    crossRefPromise = import('../data/cross-references.json').then((module) => {
      crossRefCache = (module.default || module) as Record<string, string[]>;
      return crossRefCache;
    });
  }
  return crossRefPromise;
}

/**
 * Normaliza una cadena para búsquedas insensibles a mayúsculas y acentos
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export const lexiconService = {
  /**
   * Pre-calienta los datos en segundo plano sin bloquear el renderizado
   */
  preload(): void {
    getStrongData();
    getCrossRefData();
  },

  /**
   * Obtiene una entrada específica de Strong por su ID (ej. "H7965" o "G3056")
   */
  async getStrongEntry(id: string): Promise<StrongEntry | undefined> {
    const data = await getStrongData();
    const cleanId = id.trim().toUpperCase();
    return data[cleanId];
  },

  /**
   * Busca en el Diccionario Strong por número, lema original, transliteración o significado
   */
  async searchStrong(
    query: string,
    options?: {
      lang?: 'all' | StrongLanguage;
      maxResults?: number;
    }
  ): Promise<StrongEntry[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const data = await getStrongData();
    const norm = normalizeText(trimmed);
    const upper = trimmed.toUpperCase();
    const max = options?.maxResults || 60;
    const langFilter = options?.lang || 'all';

    const results: StrongEntry[] = [];
    const directMatches: StrongEntry[] = [];

    // Ver si es búsqueda por número directo (ej: "7965", "H7965", "G3056")
    if (/^[HG]?\d+$/i.test(trimmed)) {
      const numPart = trimmed.replace(/\D/g, '');
      const hKey = `H${numPart}`;
      const gKey = `G${numPart}`;

      if (langFilter === 'all' || langFilter === 'hebrew') {
        if (data[hKey]) directMatches.push(data[hKey]);
      }
      if (langFilter === 'all' || langFilter === 'greek') {
        if (data[gKey]) directMatches.push(data[gKey]);
      }
    }

    for (const id in data) {
      const entry = data[id];
      if (langFilter !== 'all' && entry.lang !== langFilter) continue;
      if (directMatches.some((m) => m.id === entry.id)) continue;

      // Coincidencias en lema original, transliteración, glosa en español, definición o traducciones
      const matchLemma = entry.lemma && entry.lemma.includes(trimmed);
      const matchTranslit = entry.translit && normalizeText(entry.translit).includes(norm);
      const matchPron = entry.pron && normalizeText(entry.pron).includes(norm);
      const matchGloss = entry.esGloss && normalizeText(entry.esGloss).includes(norm);
      const matchDef = entry.def && normalizeText(entry.def).includes(norm);
      const matchKjv = entry.kjv && normalizeText(entry.kjv).includes(norm);
      const matchCategory = entry.category && normalizeText(entry.category).includes(norm);

      if (
        matchLemma ||
        matchTranslit ||
        matchPron ||
        matchGloss ||
        matchDef ||
        matchKjv ||
        matchCategory
      ) {
        results.push(entry);
        if (results.length + directMatches.length >= max) break;
      }
    }

    return [...directMatches, ...results];
  },

  /**
   * Obtiene las referencias cruzadas bíblicas de un versículo (TSK) con texto bíblico integrado
   */
  async getCrossReferences(
    bookId: number,
    chapter: number,
    verse: number
  ): Promise<CrossReferenceItem[]> {
    const data = await getCrossRefData();
    const key = `${bookId}-${chapter}-${verse}`;
    const rawRefs = data[key];
    if (!rawRefs || rawRefs.length === 0) return [];

    return rawRefs.map((refStr) => {
      const [tBookIdStr, tChapterStr, tVerseStr] = refStr.split(':');
      const targetBookId = parseInt(tBookIdStr, 10);
      const targetChapter = parseInt(tChapterStr, 10);
      const targetVerse = parseInt(tVerseStr, 10);

      const targetBook = bibleService.getBook(targetBookId);
      const targetBookName = targetBook ? targetBook.name : `Libro ${targetBookId}`;
      const targetReference = `${targetBookName} ${targetChapter}:${targetVerse}`;
      const verseText = bibleService.getVerse(targetBookId, targetChapter, targetVerse) || '';

      return {
        targetBookId,
        targetBookName,
        targetChapter,
        targetVerse,
        targetReference,
        verseText,
      };
    });
  },

  /**
   * Obtiene las referencias cruzadas para un conjunto de versículos seleccionados
   */
  async getCrossReferencesForVerses(
    bookId: number,
    chapter: number,
    verses: number[]
  ): Promise<{ verse: number; references: CrossReferenceItem[] }[]> {
    const list: { verse: number; references: CrossReferenceItem[] }[] = [];
    for (const v of verses) {
      const refs = await this.getCrossReferences(bookId, chapter, v);
      if (refs.length > 0) {
        list.push({ verse: v, references: refs });
      }
    }
    return list;
  },

  /**
   * Verifica de manera rápida si un versículo tiene referencias cruzadas cargadas
   */
  hasCrossReferencesInCache(bookId: number, chapter: number, verse: number): boolean {
    if (!crossRefCache) return false;
    const key = `${bookId}-${chapter}-${verse}`;
    return !!crossRefCache[key]?.length;
  },

  /**
   * Retorna los términos teológicos fundamentales (Shalom, Hesed, Ruaj, Logos, Ágape, etc.)
   */
  getTheologicalTerms(): TheologicalTerm[] {
    return theologicalTermsData as TheologicalTerm[];
  },

  /**
   * Retorna un término teológico específico por ID
   */
  getTheologicalTerm(id: string): TheologicalTerm | undefined {
    return (theologicalTermsData as TheologicalTerm[]).find((t) => t.id === id);
  },
};
