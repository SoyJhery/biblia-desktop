import { Bookmark, Collection, Favorite, Highlight, UserSettings } from '../types';

export interface BibleUserData {
  version: number;
  settings: UserSettings;
  favorites: Record<string, Favorite>;
  highlights: Record<string, Highlight>;
  bookmarks: Bookmark[];
  collections: Collection[];
}

const STORAGE_KEY = 'biblia_rvr1960_data';

const defaultSettings: UserSettings = {
  theme: 'dark',
  fontSize: 19,
  fontFamily: 'serif',
  lineHeight: 1.85,
  showVerseNumbers: true,
  lastRead: {
    bookId: 1, // Génesis
    chapter: 1,
    verse: 1,
  },
};

const defaultCollections: Collection[] = [
  {
    id: 'col-paz-fortaleza',
    name: 'Paz y Fortaleza',
    description: 'Pasajes para momentos de dificultad, consuelo y fortaleza espiritual.',
    color: '#0ea5e9', // Sky blue
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-salmos-23',
        collectionId: 'col-paz-fortaleza',
        bookId: 19, // Salmos
        chapter: 23,
        verseStart: 1,
        verseEnd: 6,
        isFullChapter: true,
        textSnippet: 'Jehová es mi pastor; nada me faltará...',
        note: 'Salmo de confianza plena en el cuidado de Dios.',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'item-filipenses-4-6-7',
        collectionId: 'col-paz-fortaleza',
        bookId: 50, // Filipenses
        chapter: 4,
        verseStart: 6,
        verseEnd: 7,
        textSnippet: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones...',
        note: 'La paz de Dios que sobrepasa todo entendimiento.',
        addedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'col-promesas',
    name: 'Grandes Promesas',
    description: 'Promesas fundamentales de Dios a través de las Escrituras.',
    color: '#f59e0b', // Amber/gold
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-romanos-8-28',
        collectionId: 'col-promesas',
        bookId: 45, // Romanos
        chapter: 8,
        verseStart: 28,
        verseEnd: 28,
        textSnippet: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien...',
        note: 'Propósito soberano.',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'item-jeremias-29-11',
        collectionId: 'col-promesas',
        bookId: 24, // Jeremías
        chapter: 29,
        verseStart: 11,
        verseEnd: 11,
        textSnippet: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová...',
        note: 'Planes de bienestar y esperanza.',
        addedAt: new Date().toISOString(),
      },
    ],
  },
];

export const initialData: BibleUserData = {
  version: 1,
  settings: defaultSettings,
  favorites: {},
  highlights: {},
  bookmarks: [
    {
      id: 'bm-initial',
      bookId: 1,
      chapter: 1,
      verse: 1,
      label: 'Comienzo de la Biblia',
      note: 'Inicio de la lectura anual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  collections: defaultCollections,
};

let memoryData: BibleUserData = initialData;
let isLoaded = false;
let saveTimeout: any = null;

export const storageService = {
  async load(): Promise<BibleUserData> {
    if (isLoaded) return memoryData;

    try {
      if (window.electronAPI?.getUserData) {
        const electronData = await window.electronAPI.getUserData();
        if (electronData && electronData.version) {
          memoryData = {
            ...initialData,
            ...electronData,
            settings: { ...defaultSettings, ...electronData.settings },
          };
          isLoaded = true;
          return memoryData;
        }
      }

      // Fallback a localStorage
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        memoryData = {
          ...initialData,
          ...parsed,
          settings: { ...defaultSettings, ...parsed.settings },
        };
      } else {
        memoryData = initialData;
        await this.save(memoryData);
      }
    } catch (e) {
      console.error('Error al cargar datos de usuario:', e);
      memoryData = initialData;
    }

    isLoaded = true;
    return memoryData;
  },

  getData(): BibleUserData {
    return memoryData;
  },

  async save(data: BibleUserData): Promise<void> {
    memoryData = data;

    // Debounce disk/storage writes to optimize performance
    if (saveTimeout) clearTimeout(saveTimeout);

    return new Promise((resolve) => {
      saveTimeout = setTimeout(async () => {
        try {
          if (window.electronAPI?.saveUserData) {
            await window.electronAPI.saveUserData(memoryData);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryData));
        } catch (e) {
          console.error('Error al guardar datos de usuario:', e);
        }
        resolve();
      }, 250);
    });
  },

  async exportBackup(): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> {
    if (window.electronAPI?.exportBackup) {
      return await window.electronAPI.exportBackup(memoryData);
    }
    // Web fallback: download as JSON file
    try {
      const blob = new Blob([JSON.stringify(memoryData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo_biblia_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async importBackup(): Promise<{ success: boolean; data?: BibleUserData; error?: string }> {
    if (window.electronAPI?.importBackup) {
      const res = await window.electronAPI.importBackup();
      if (res.success && res.data) {
        memoryData = { ...initialData, ...res.data };
        await this.save(memoryData);
        return { success: true, data: memoryData };
      }
      return { success: false, error: res.error };
    }
    return { success: false, error: 'Función solo disponible en aplicación de escritorio' };
  },
};
