import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Languages, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Scroll,
  BookMarked,
  ChevronRight
} from 'lucide-react';
import { Book, StrongEntry, CrossReferenceItem, StrongLanguage } from '../types';
import { lexiconService } from '../services/lexiconService';
import { bibleService } from '../services/bibleService';

interface LexiconModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book;
  currentChapter: number;
  selectedVerse?: number;
  initialTab?: 'cross_refs' | 'strong' | 'theology';
  onJumpToReference: (bookId: number, chapter: number, verse: number) => void;
  onSearchGlobal?: (term: string) => void;
}

export const LexiconModal: React.FC<LexiconModalProps> = ({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  selectedVerse = 1,
  initialTab = 'cross_refs',
  onJumpToReference,
  onSearchGlobal,
}) => {
  const [activeTab, setActiveTab] = useState<'cross_refs' | 'strong' | 'theology'>(initialTab);
  
  // Referencias Cruzadas (TSK) State
  const [activeVerseNum, setActiveVerseNum] = useState<number>(selectedVerse);
  const [crossRefs, setCrossRefs] = useState<CrossReferenceItem[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);
  const [refFilter, setRefFilter] = useState<'all' | 'AT' | 'NT'>('all');
  
  // Léxico Strong State
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | StrongLanguage>('all');
  const [strongResults, setStrongResults] = useState<StrongEntry[]>([]);
  const [isLoadingStrong, setIsLoadingStrong] = useState(false);
  const [selectedStrongEntry, setSelectedStrongEntry] = useState<StrongEntry | null>(null);

  // Conceptos Teológicos State
  const [theologyFilter, setTheologyFilter] = useState<'all' | 'AT' | 'NT'>('all');
  const theologicalTerms = useMemo(() => lexiconService.getTheologicalTerms(), []);
  
  // Feedback copiado
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sincronizar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (selectedVerse) setActiveVerseNum(selectedVerse);
    }
  }, [isOpen, initialTab, selectedVerse]);

  // Cargar referencias cruzadas del versículo activo
  useEffect(() => {
    if (!isOpen || activeTab !== 'cross_refs') return;

    let isMounted = true;
    setIsLoadingRefs(true);

    lexiconService.getCrossReferences(currentBook.id, currentChapter, activeVerseNum)
      .then((refs) => {
        if (isMounted) {
          setCrossRefs(refs);
          setIsLoadingRefs(false);
        }
      })
      .catch((err) => {
        console.error('Error cargando referencias cruzadas:', err);
        if (isMounted) {
          setCrossRefs([]);
          setIsLoadingRefs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, currentBook.id, currentChapter, activeVerseNum]);

  // Cargar búsquedas de Strong
  useEffect(() => {
    if (!isOpen || activeTab !== 'strong') return;

    let isMounted = true;
    setIsLoadingStrong(true);

    const term = searchQuery.trim() || (currentBook.testament === 'Antiguo Testamento' ? 'H7965' : 'G3056');

    const timer = setTimeout(() => {
      lexiconService.searchStrong(term, { lang: langFilter, maxResults: 80 })
        .then((res) => {
          if (isMounted) {
            setStrongResults(res);
            if (res.length > 0 && !selectedStrongEntry) {
              setSelectedStrongEntry(res[0]);
            }
            setIsLoadingStrong(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setStrongResults([]);
            setIsLoadingStrong(false);
          }
        });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, activeTab, searchQuery, langFilter]);

  // Manejo de ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copiar al portapapeles
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Filtrado de referencias cruzadas
  const filteredCrossRefs = useMemo(() => {
    if (refFilter === 'all') return crossRefs;
    return crossRefs.filter((r) => {
      const book = bibleService.getBook(r.targetBookId);
      if (!book) return true;
      if (refFilter === 'AT') return book.testament === 'Antiguo Testamento';
      return book.testament === 'Nuevo Testamento';
    });
  }, [crossRefs, refFilter]);

  // Filtrado de conceptos teológicos
  const filteredTerms = useMemo(() => {
    if (theologyFilter === 'all') return theologicalTerms;
    return theologicalTerms.filter((t) => 
      theologyFilter === 'AT' ? t.testament === 'Antiguo Testamento' : t.testament === 'Nuevo Testamento'
    );
  }, [theologicalTerms, theologyFilter]);

  if (!isOpen) return null;

  const currentVerseText = bibleService.getVerse(currentBook.id, currentChapter, activeVerseNum) || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Concordancia Strong & Estudio Léxico
                </h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                  v0.4.0
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Léxico Hebreo/Griego y Referencias Cruzadas TSK • Por SoyJhery
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 bg-stone-100/50 dark:bg-stone-900/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cross_refs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cross_refs'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Referencias Cruzadas (TSK)</span>
            {crossRefs.length > 0 && activeTab === 'cross_refs' && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {crossRefs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('strong')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'strong'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Diccionario y Léxico Strong</span>
          </button>

          <button
            onClick={() => setActiveTab('theology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'theology'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Términos Teológicos Clave</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col select-text">

          {/* TAB 1: REFERENCIAS CRUZADAS (TSK) */}
          {activeTab === 'cross_refs' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Context Selector & Info Header */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                    Versículo a examinar:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs">
                      {currentBook.name} {currentChapter}
                    </span>
                    <select
                      value={activeVerseNum}
                      onChange={(e) => setActiveVerseNum(parseInt(e.target.value, 10))}
                      className="px-2.5 py-1 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {bibleService.getChapterVerses(currentBook.id, currentChapter).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          Versículo {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setRefFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      refFilter === 'all'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Todos ({crossRefs.length})
                  </button>
                  <button
                    onClick={() => setRefFilter('AT')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      refFilter === 'AT'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Antiguo Testamento
                  </button>
                  <button
                    onClick={() => setRefFilter('NT')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      refFilter === 'NT'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Nuevo Testamento
                  </button>
                </div>
              </div>

              {/* Versículo Fuente Destacado */}
              <div className="px-5 py-3.5 bg-amber-500/5 border-b border-amber-500/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    {currentBook.name} {currentChapter}:{activeVerseNum} (Reina-Valera 1960)
                  </span>
                  <button
                    onClick={() => handleCopy(`"${currentVerseText}" — ${currentBook.name} ${currentChapter}:${activeVerseNum} (RVR1960)`, 'source-verse')}
                    className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-amber-600 transition-colors"
                  >
                    {copiedKey === 'source-verse' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'source-verse' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed italic">
                  "{currentVerseText}"
                </p>
              </div>

              {/* Lista de Referencias Cruzadas */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {isLoadingRefs ? (
                  <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Cargando tesoro de referencias cruzadas...</span>
                  </div>
                ) : filteredCrossRefs.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-center p-6">
                    <BookMarked className="w-12 h-12 text-stone-300 dark:text-stone-700 mb-2 stroke-1" />
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      No se encontraron referencias cruzadas con los filtros actuales
                    </p>
                    <p className="text-xs text-stone-400 mt-1 max-w-md">
                      Intenta seleccionar otro versículo del capítulo o alternar el filtro entre Antiguo y Nuevo Testamento.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredCrossRefs.map((ref, idx) => {
                      const copyId = `ref-${idx}`;
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all shadow-xs flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800">
                              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {ref.targetReference}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopy(`"${ref.verseText}" — ${ref.targetReference} (RVR1960)`, copyId)}
                                  className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                                  title="Copiar versículo y cita"
                                >
                                  {copiedKey === copyId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    onJumpToReference(ref.targetBookId, ref.targetChapter, ref.targetVerse);
                                    onClose();
                                  }}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-500 hover:text-white text-stone-600 dark:text-stone-300 text-[11px] font-medium transition-all"
                                  title="Navegar a este pasaje en la Biblia"
                                >
                                  <span>Ir al texto</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-stone-700 dark:text-stone-300 font-serif leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                              {ref.verseText || '(Texto no disponible)'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DICCIONARIO Y LÉXICO STRONG */}
          {activeTab === 'strong' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Search & Results List */}
              <div className="w-full md:w-5/12 border-r border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden bg-stone-50/50 dark:bg-stone-900/30">
                {/* Search Bar */}
                <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 space-y-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar número (H7965, G3056), raíz, transliteración o español..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Language Filter */}
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setLangFilter('all')}
                      className={`flex-1 py-1 rounded-lg text-center font-medium transition-all ${
                        langFilter === 'all'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setLangFilter('hebrew')}
                      className={`flex-1 py-1 rounded-lg text-center font-medium transition-all ${
                        langFilter === 'hebrew'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Hebreo (A.T.)
                    </button>
                    <button
                      onClick={() => setLangFilter('greek')}
                      className={`flex-1 py-1 rounded-lg text-center font-medium transition-all ${
                        langFilter === 'greek'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Griego (N.T.)
                    </button>
                  </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                  {isLoadingStrong ? (
                    <div className="h-48 flex items-center justify-center text-xs text-stone-400 gap-2">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>Buscando en concordancia...</span>
                    </div>
                  ) : strongResults.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 text-xs">
                      No se encontraron entradas en el diccionario para "{searchQuery}".
                    </div>
                  ) : (
                    strongResults.map((entry) => {
                      const isSelected = selectedStrongEntry?.id === entry.id;
                      return (
                        <button
                          key={entry.id}
                          onClick={() => setSelectedStrongEntry(entry)}
                          className={`w-full text-left p-3 transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-l-4 border-amber-600 dark:bg-amber-500/20'
                              : 'hover:bg-stone-100/70 dark:hover:bg-stone-800/50'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 font-mono">
                                {entry.id}
                              </span>
                              <span className="text-xs text-stone-500 font-medium truncate">
                                {entry.translit || entry.lemma}
                              </span>
                              {entry.category && (
                                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 text-[9px] text-stone-600 dark:text-stone-300">
                                  {entry.category}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 truncate">
                              {entry.esGloss || entry.def}
                            </p>
                          </div>
                          <span className={`text-base font-serif flex-shrink-0 ${entry.lang === 'hebrew' ? 'font-serif' : ''}`}>
                            {entry.lemma}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Entry Details Card */}
              <div className="w-full md:w-7/12 flex-1 overflow-y-auto p-6 bg-white dark:bg-stone-900">
                {selectedStrongEntry ? (
                  <div className="space-y-6">
                    {/* Header Card */}
                    <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-mono font-bold text-sm shadow-xs">
                              {selectedStrongEntry.id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                              {selectedStrongEntry.lang === 'hebrew' ? 'Hebreo Bíblico' : 'Griego Koiné'}
                            </span>
                            {selectedStrongEntry.category && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                {selectedStrongEntry.category}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {selectedStrongEntry.translit}
                          </h3>
                          {selectedStrongEntry.pron && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              Pronunciación: <span className="font-mono text-stone-700 dark:text-stone-300">/{selectedStrongEntry.pron}/</span>
                            </p>
                          )}
                        </div>

                        {/* Vocablo Original en tipografía grande */}
                        <div className="text-right">
                          <span className={`text-4xl text-amber-600 dark:text-amber-400 font-serif leading-none block select-all ${selectedStrongEntry.lang === 'hebrew' ? 'dir-rtl' : ''}`}>
                            {selectedStrongEntry.lemma}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Glosa o Significado Principal en Español */}
                    {selectedStrongEntry.esGloss && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                          Significado Teológico en Español:
                        </span>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {selectedStrongEntry.esGloss}
                        </p>
                      </div>
                    )}

                    {/* Etimología y Raíz Léxica */}
                    {selectedStrongEntry.deriv && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                          Etimología y Raíz:
                        </h4>
                        <div className="p-3.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/60 text-xs text-stone-700 dark:text-stone-300 font-mono leading-relaxed">
                          {selectedStrongEntry.deriv}
                        </div>
                      </div>
                    )}

                    {/* Definición Exhaustiva Strong */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Definición Exhaustiva Strong:
                      </h4>
                      <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed">
                        {selectedStrongEntry.def}
                      </div>
                    </div>

                    {/* Ocurrencias / Traducciones */}
                    {selectedStrongEntry.kjv && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                          Traducciones y Ocurrencias Bíblicas Frecuentes:
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-850 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
                          "{selectedStrongEntry.kjv}"
                        </p>
                      </div>
                    )}

                    {/* Botón para buscar en la Biblia */}
                    {onSearchGlobal && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            const termToSearch = selectedStrongEntry.esGloss 
                              ? selectedStrongEntry.esGloss.split(',')[0].trim()
                              : selectedStrongEntry.translit;
                            onSearchGlobal(termToSearch);
                            onClose();
                          }}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-semibold text-xs transition-all shadow-md active:scale-98"
                        >
                          <Search className="w-4 h-4" />
                          <span>Buscar ocurrencias de este vocablo en la Biblia</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center">
                    <Scroll className="w-12 h-12 text-stone-300 dark:text-stone-700 mb-2 stroke-1" />
                    <p className="text-sm font-medium">Selecciona una entrada del diccionario a la izquierda</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Podrás ver su raíz etimológica, pronunciación y definición completa.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TÉRMINOS TEOLÓGICOS CLAVE */}
          {activeTab === 'theology' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Category / Testament Filter Bar */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                    Vocabulario Homilético y Doctrinal Fundamental
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Estudio de las palabras maestras de la revelación bíblica en sus lenguas originales.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setTheologyFilter('all')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      theologyFilter === 'all'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Todos ({theologicalTerms.length})
                  </button>
                  <button
                    onClick={() => setTheologyFilter('AT')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      theologyFilter === 'AT'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Hebreo (A.T.)
                  </button>
                  <button
                    onClick={() => setTheologyFilter('NT')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      theologyFilter === 'NT'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Griego (N.T.)
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTerms.map((term) => (
                  <div
                    key={term.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-amber-400 dark:hover:border-amber-500 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between mb-3 pb-2 border-b border-stone-100 dark:border-stone-800">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs">
                              {term.strongId}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500">
                              {term.category}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                            {term.name}
                          </h4>
                          <span className="text-xs text-stone-500 italic">
                            {term.translit}
                          </span>
                        </div>
                        <span className="text-3xl text-amber-600 dark:text-amber-400 font-serif">
                          {term.original}
                        </span>
                      </div>

                      {/* Resumen & Explicación */}
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400/90 mb-2">
                        {term.shortSummary}
                      </p>

                      <p className="text-xs text-stone-700 dark:text-stone-300 font-serif leading-relaxed mb-4">
                        {term.explanation}
                      </p>
                    </div>

                    {/* Versículos Clave */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] font-bold text-stone-400 uppercase mr-1">Pasajes:</span>
                        {term.keyVerses.slice(0, 4).map((vRef, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-medium text-stone-600 dark:text-stone-300"
                          >
                            {vRef}
                          </span>
                        ))}
                      </div>

                      {/* Abrir en Léxico Strong */}
                      <button
                        onClick={() => {
                          setSearchQuery(term.strongId);
                          setActiveTab('strong');
                        }}
                        className="flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold transition-colors"
                      >
                        <span>Ver en Strong</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              Biblia RVR 1960 • SoyJhery
            </span>
            <span>—</span>
            <span>386,905 referencias cruzadas y 14,197 vocablos Strong offline</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
