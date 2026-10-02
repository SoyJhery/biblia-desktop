import { Bookmark, Collection, Favorite, Highlight, StudyNote, UserSettings } from '../types';

export interface BibleUserData {
  version: number;
  settings: UserSettings;
  favorites: Record<string, Favorite>;
  highlights: Record<string, Highlight>;
  bookmarks: Bookmark[];
  collections: Collection[];
  notes: StudyNote[];
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

const defaultNotes: StudyNote[] = [
  {
    id: 'note-armadura-dios',
    title: 'Bosquejo: La Armadura de Dios y la Victoria Espiritual',
    tags: ['Bosquejo', 'Sermón', 'Vida Cristiana'],
    linkedVerses: [
      {
        id: 'link-efesios-6-10-18',
        bookId: 49, // Efesios
        chapter: 6,
        verseStart: 10,
        verseEnd: 18,
        reference: 'Efesios 6:10-18',
        textSnippet: 'Por lo demás, hermanos míos, fortaleceos en el Señor, y en el poder de su fuerza. Vestíos de toda la armadura de Dios...',
      },
    ],
    content: `# Bosquejo: La Armadura de Dios y la Victoria Espiritual

> "Por lo demás, hermanos míos, fortaleceos en el Señor, y en el poder de su fuerza." — Efesios 6:10

## I. El Fundamento de Nuestra Fuerza (vv. 10-13)
- No batallamos en nuestras propias fuerzas humanas, sino en la fortaleza infinita de Cristo.
- **Vestíos de toda la armadura**: No es una armadura parcial; Dios provee equipo completo para resistir en el día malo.
- Reconocer al verdadero enemigo: Nuestra lucha no es contra sangre y carne, sino contra principados y huestes espirituales.

## II. Las Piezas de la Armadura (vv. 14-17)
1. **El cinto de la verdad**: Sinceridad e integridad ante Dios y los hombres.
2. **La coraza de justicia**: La justicia de Cristo protegiendo nuestro corazón y emociones.
3. **El calzado del evangelio de la paz**: Firmeza y presteza para testificar y caminar en armonía.
4. **El escudo de la fe**: Para apagar todos los dardos de fuego del maligno (la duda, el temor, la condenación).
5. **El yelmo de la salvación**: Certeza y paz protegiendo nuestros pensamientos y mente.
6. **La espada del Espíritu**: La Palabra viva de Dios (nuestra arma ofensiva fundamental).

## III. La Estrategia Continua: Oración y Vigilancia (v. 18)
- Orando en todo tiempo con toda oración y súplica en el Espíritu.
- Perseverando con vigilancia por todos los santos y ministros del evangelio.

---
*Notas de estudio personal compiladas en Biblia RVR 1960 - SoyJhery*`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  notes: defaultNotes,
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
            notes: Array.isArray(electronData.notes) ? electronData.notes : defaultNotes,
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
          notes: Array.isArray(parsed.notes) ? parsed.notes : defaultNotes,
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
