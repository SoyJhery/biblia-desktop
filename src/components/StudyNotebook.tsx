import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Search,
  Tag,
  Copy,
  Check,
  Download,
  Printer,
  X,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Eye,
  Edit3,
  Link2,
  ExternalLink,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { StudyNote, LinkedVerse } from '../types';

interface StudyNotebookProps {
  isOpen: boolean;
  onClose: () => void;
  notes: StudyNote[];
  activeNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onCreateNote: (title?: string, initialVerses?: LinkedVerse[]) => string;
  onUpdateNote: (note: StudyNote) => void;
  onDeleteNote: (id: string) => void;
  onJumpToReference: (bookId: number, chapter: number, verse: number) => void;
  currentBookName: string;
  currentBookId: number;
  currentChapter: number;
  selectedVerses: number[];
  currentChapterVerses: { verse: number; text: string }[];
}

export const StudyNotebook: React.FC<StudyNotebookProps> = ({
  isOpen,
  onClose,
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onJumpToReference,
  currentBookName,
  currentBookId,
  currentChapter,
  selectedVerses,
  currentChapterVerses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active Note
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // All unique tags across notes
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [notes]);

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = !selectedTag || n.tags?.includes(selectedTag);
      return matchSearch && matchTag;
    });
  }, [notes, searchQuery, selectedTag]);

  // Auto-select first note if none selected and notes exist
  useEffect(() => {
    if (isOpen && !activeNoteId && notes.length > 0) {
      onSelectNote(notes[0].id);
    }
  }, [isOpen, activeNoteId, notes, onSelectNote]);

  if (!isOpen) return null;

  // Insert markdown syntax helper
  const insertMarkdown = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea || !activeNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = activeNote.content;
    const selected = currentText.substring(start, end) || defaultText;

    const newContent =
      currentText.substring(0, start) +
      prefix +
      selected +
      suffix +
      currentText.substring(end);

    onUpdateNote({
      ...activeNote,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 10);
  };

  // Helper to insert current bible passage into the active note
  const handleInsertCurrentPassage = () => {
    if (!activeNote) return;

    let refText = '';
    let snippet = '';

    if (selectedVerses.length > 0) {
      const sorted = [...selectedVerses].sort((a, b) => a - b);
      const vStart = sorted[0];
      const vEnd = sorted[sorted.length - 1];
      refText = `${currentBookName} ${currentChapter}:${vStart}${vEnd > vStart ? `-${vEnd}` : ''}`;

      const matchedTexts = currentChapterVerses
        .filter((v) => sorted.includes(v.verse))
        .map((v) => `${v.verse}. ${v.text}`)
        .join(' ');
      snippet = matchedTexts;
    } else {
      refText = `${currentBookName} Cap. ${currentChapter}`;
      snippet = currentChapterVerses.slice(0, 3).map((v) => `${v.verse}. ${v.text}`).join(' ') + '...';
    }

    const passageBlock = `\n\n> "${snippet}"\n> — **${refText} (RVR 1960)**\n\n`;

    // Also link the verse if not already linked
    const sorted = selectedVerses.length > 0 ? [...selectedVerses].sort((a, b) => a - b) : [1];
    const vStart = sorted[0];
    const vEnd = sorted[sorted.length - 1];
    const alreadyLinked = activeNote.linkedVerses.some(
      (lv) => lv.bookId === currentBookId && lv.chapter === currentChapter && lv.verseStart === vStart
    );

    let updatedLinked = activeNote.linkedVerses;
    if (!alreadyLinked) {
      const newLink: LinkedVerse = {
        id: `link-${Date.now()}`,
        bookId: currentBookId,
        chapter: currentChapter,
        verseStart: vStart,
        verseEnd: vEnd > vStart ? vEnd : undefined,
        reference: refText,
        textSnippet: snippet.slice(0, 120),
      };
      updatedLinked = [...activeNote.linkedVerses, newLink];
    }

    onUpdateNote({
      ...activeNote,
      content: (activeNote.content || '') + passageBlock,
      linkedVerses: updatedLinked,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add current reference as linked verse only
  const handleLinkCurrentVerse = () => {
    if (!activeNote) return;
    const sorted = selectedVerses.length > 0 ? [...selectedVerses].sort((a, b) => a - b) : [1];
    const vStart = sorted[0];
    const vEnd = sorted[sorted.length - 1];
    const ref = `${currentBookName} ${currentChapter}:${vStart}${vEnd > vStart ? `-${vEnd}` : ''}`;

    const alreadyLinked = activeNote.linkedVerses.some(
      (lv) => lv.bookId === currentBookId && lv.chapter === currentChapter && lv.verseStart === vStart
    );

    if (alreadyLinked) return;

    const matchedText = currentChapterVerses
      .filter((v) => sorted.includes(v.verse))
      .map((v) => v.text)
      .join(' ') || 'Pasaje de las Escrituras';

    const newLink: LinkedVerse = {
      id: `link-${Date.now()}`,
      bookId: currentBookId,
      chapter: currentChapter,
      verseStart: vStart,
      verseEnd: vEnd > vStart ? vEnd : undefined,
      reference: ref,
      textSnippet: matchedText.slice(0, 100),
    };

    onUpdateNote({
      ...activeNote,
      linkedVerses: [...activeNote.linkedVerses, newLink],
      updatedAt: new Date().toISOString(),
    });
  };

  // Remove linked verse
  const handleRemoveLink = (linkId: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      linkedVerses: activeNote.linkedVerses.filter((l) => l.id !== linkId),
      updatedAt: new Date().toISOString(),
    });
  };

  // Add tag
  const handleAddTag = () => {
    if (!newTagInput.trim() || !activeNote) return;
    const clean = newTagInput.trim();
    if (!activeNote.tags.includes(clean)) {
      onUpdateNote({
        ...activeNote,
        tags: [...activeNote.tags, clean],
        updatedAt: new Date().toISOString(),
      });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      tags: activeNote.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  // Copy note to clipboard with copyright
  const handleCopyNote = () => {
    if (!activeNote) return;
    const fullText = `${activeNote.title}\n\n${activeNote.content}\n\n---\nPasajes vinculados: ${
      activeNote.linkedVerses.map((l) => l.reference).join(', ') || 'Ninguno'
    }\nEstudio creado en Biblia RVR 1960 - SoyJhery (soyjhery@gmail.com)\nCopyright © 2026 SoyJhery. Todos los derechos reservados.`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as .md file
  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const sanitizedTitle = (activeNote.title || 'Bosquejo')
      .replace(/[^a-z0-9áéíóúñ_-]/gi, '_')
      .toLowerCase();
    const content = `# ${activeNote.title}\n\n*Fecha: ${new Date(
      activeNote.updatedAt
    ).toLocaleDateString()}*\n*Etiquetas: ${activeNote.tags.join(', ')}*\n\n${
      activeNote.content
    }\n\n---\n### Pasajes Bíblicos Vinculados\n${activeNote.linkedVerses
      .map((l) => `- **${l.reference}**: ${l.textSnippet}`)
      .join('\n')}\n\n---\n*Compilado con Biblia RVR 1960 Desktop por SoyJhery*\n*Contacto: soyjhery@gmail.com*\n*Copyright © 2026 SoyJhery. Todos los derechos reservados.*`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print sermon note
  const handlePrint = () => {
    window.print();
  };

  return (
    <aside
      className={`border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-col z-20 transition-all duration-300 shadow-xl select-none ${
        isMaximized
          ? 'fixed inset-0 z-50 w-full h-full'
          : 'w-full lg:w-[480px] xl:w-[540px] h-[calc(100vh-3.5rem)] flex-shrink-0'
      }`}
    >
      {/* Top Header */}
      <div className="h-14 px-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-semibold text-sm">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="tracking-tight">Cuaderno de Bosquejos & Estudio</span>
            <span className="hidden sm:inline text-xs font-normal text-stone-400 ml-2">
              ({notes.length} {notes.length === 1 ? 'nota' : 'notas'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            title={isMaximized ? 'Restaurar panel dividido' : 'Maximizar cuaderno'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            title="Cerrar cuaderno"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split Body: Sidebar list (on large / maximized) + Active Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Note List / Selector (Left Column if maximized or collapsible) */}
        <div
          className={`flex flex-col border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 ${
            isMaximized ? 'w-72 sm:w-80' : 'w-48 sm:w-56'
          }`}
        >
          {/* Quick Actions & Search */}
          <div className="p-3 border-b border-stone-200 dark:border-stone-800 space-y-2">
            <button
              onClick={() => onCreateNote()}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Nota / Bosquejo</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Tag Pills Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2 py-0.5 rounded-full transition-colors whitespace-nowrap font-medium ${
                    selectedTag === null
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  Todas
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2 py-0.5 rounded-full transition-colors whitespace-nowrap font-medium ${
                      selectedTag === tag
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60 p-1.5 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-400" />
                <span>No se encontraron notas</span>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === activeNoteId;
                return (
                  <button
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex flex-col gap-1 border ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 shadow-xs'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 border-transparent text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">
                      {note.title || 'Sin título'}
                    </div>

                    <div className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {note.content.replace(/[#*>`]/g, '').trim() || 'Nota vacía...'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      {note.linkedVerses?.length > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                          <BookOpen className="w-3 h-3" />
                          {note.linkedVerses.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Note Editor / Preview (Right Column) */}
        {activeNote ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-stone-900 overflow-hidden select-text">
            {/* Note Toolbar: Title, Tags, Mode Toggle, Export */}
            <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-2.5 bg-stone-50/50 dark:bg-stone-850/50">
              {/* Title & View Switcher */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) =>
                    onUpdateNote({
                      ...activeNote,
                      title: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  placeholder="Título del bosquejo o estudio..."
                  className="flex-1 bg-transparent font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none border-b border-transparent focus:border-emerald-500 pb-0.5"
                />

                {/* View Mode (Edit / Preview) */}
                <div className="flex items-center bg-stone-200 dark:bg-stone-800 rounded-lg p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                      viewMode === 'edit'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    title="Modo Edición"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editor</span>
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    title="Modo Púlpito / Vista Previa Limpia"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Púlpito</span>
                  </button>
                </div>

                {/* Quick Action Menu */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyNote}
                    className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                    title="Copiar texto completo del bosquejo"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                    title="Descargar archivo Markdown (.md)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrint}
                    className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                    title="Imprimir / Exportar a PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar el bosquejo "${activeNote.title}"?`)) {
                        onDeleteNote(activeNote.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-colors"
                    title="Eliminar bosquejo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tags & Linked Scriptures Bar */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {/* Tags */}
                {activeNote.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium"
                  >
                    #{t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-500 text-stone-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {isAddingTag ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Etiqueta..."
                      className="px-2 py-0.5 text-[11px] rounded-md border border-emerald-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none w-24"
                      autoFocus
                    />
                    <button
                      onClick={handleAddTag}
                      className="text-emerald-600 hover:text-emerald-700 text-[11px] font-semibold"
                    >
                      Ok
                    </button>
                    <button
                      onClick={() => setIsAddingTag(false)}
                      className="text-stone-400 hover:text-stone-600 text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 text-[11px]"
                  >
                    <Plus className="w-3 h-3" /> Etiqueta
                  </button>
                )}

                <div className="h-3 w-[1px] bg-stone-300 dark:bg-stone-700 mx-1" />

                {/* Quick Link/Insert Passage Trigger */}
                <button
                  onClick={handleInsertCurrentPassage}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 text-[11px] font-semibold transition-colors"
                  title="Inserta la cita bíblica seleccionada en el texto y la vincula"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>+ Citar pasaje actual</span>
                </button>

                <button
                  onClick={handleLinkCurrentVerse}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] transition-colors"
                  title="Vincular el pasaje actual a las referencias de esta nota sin escribir en el texto"
                >
                  <Link2 className="w-3 h-3" />
                  <span>Vincular</span>
                </button>
              </div>

              {/* Linked Verses Pills */}
              {activeNote.linkedVerses.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Pasajes Vinculados:
                  </span>
                  {activeNote.linkedVerses.map((lv) => (
                    <div
                      key={lv.id}
                      className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-300/40 dark:border-amber-700/40"
                    >
                      <button
                        onClick={() => onJumpToReference(lv.bookId, lv.chapter, lv.verseStart)}
                        className="hover:underline flex items-center gap-1"
                        title={`Ir a ${lv.reference} en la Biblia`}
                      >
                        <BookOpen className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{lv.reference}</span>
                      </button>
                      <button
                        onClick={() => handleRemoveLink(lv.id)}
                        className="hover:text-red-500 text-stone-400 ml-1 transition-colors"
                        title="Desvincular pasaje"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Markdown Quick Helpers Toolbar (Only in Edit mode) */}
            {viewMode === 'edit' && (
              <div className="px-3 py-1.5 border-b border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-800/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => insertMarkdown('**', '**', 'texto en negrita')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Negrita (**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*', 'texto en cursiva')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Cursiva (*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <div className="h-3 w-[1px] bg-stone-300 dark:bg-stone-700 mx-0.5" />
                <button
                  onClick={() => insertMarkdown('# ', '', 'Encabezado Principal')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Título H1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertMarkdown('## ', '', 'Punto Principal')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Subtítulo H2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertMarkdown('### ', '', 'Sub-punto')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Sub-sección H3"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <div className="h-3 w-[1px] bg-stone-300 dark:bg-stone-700 mx-0.5" />
                <button
                  onClick={() => insertMarkdown('> ', '', 'Cita bíblica o reflexión')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Cita / Bloque (>)"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertMarkdown('- ', '', 'Punto de lista')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Lista con viñetas"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertMarkdown('1. ', '', 'Punto numerado')}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Lista numerada"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertMarkdown('\n---\n')}
                  className="px-1.5 py-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-mono transition-colors"
                  title="Separador horizontal"
                >
                  ---
                </button>
              </div>
            )}

            {/* Editor Canvas or Pulpit Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">
              {viewMode === 'edit' ? (
                <textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={(e) =>
                    onUpdateNote({
                      ...activeNote,
                      content: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  placeholder="Escribe tu sermón, puntos de estudio, referencias cruzadas o aplicaciones prácticas aquí en formato Markdown..."
                  className="w-full h-full bg-transparent resize-none focus:outline-none font-sans text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-100 placeholder-stone-400 select-text"
                />
              ) : (
                /* Formatted Pulpit / Reader Mode */
                <div className="max-w-3xl mx-auto space-y-4 text-stone-900 dark:text-stone-100 font-serif leading-relaxed text-base sm:text-lg">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400 font-sans border-b border-stone-200 dark:border-stone-800 pb-3">
                    {activeNote.title || 'Bosquejo sin título'}
                  </h1>

                  <div className="flex items-center gap-3 text-xs font-sans text-stone-400 pb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(activeNote.updatedAt).toLocaleDateString()}
                    </span>
                    {activeNote.tags.length > 0 && (
                      <span>• {activeNote.tags.map((t) => `#${t}`).join(' ')}</span>
                    )}
                  </div>

                  <div className="prose dark:prose-invert max-w-none space-y-3 font-serif">
                    {activeNote.content.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return (
                          <h2
                            key={idx}
                            className="text-xl sm:text-2xl font-bold font-sans text-stone-900 dark:text-stone-100 pt-3"
                          >
                            {line.replace('# ', '')}
                          </h2>
                        );
                      }
                      if (line.startsWith('## ')) {
                        return (
                          <h3
                            key={idx}
                            className="text-lg sm:text-xl font-bold font-sans text-amber-600 dark:text-amber-400 pt-2"
                          >
                            {line.replace('## ', '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('### ')) {
                        return (
                          <h4
                            key={idx}
                            className="text-base sm:text-lg font-semibold font-sans text-stone-800 dark:text-stone-200 pt-1"
                          >
                            {line.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (line.startsWith('> ')) {
                        return (
                          <blockquote
                            key={idx}
                            className="pl-4 py-1 border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 italic rounded-r text-stone-800 dark:text-stone-200 my-2"
                          >
                            {line.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                          <li key={idx} className="ml-5 list-disc text-stone-800 dark:text-stone-200">
                            {line.substring(2)}
                          </li>
                        );
                      }
                      if (/^\d+\.\s/.test(line)) {
                        return (
                          <li
                            key={idx}
                            className="ml-5 list-decimal text-stone-800 dark:text-stone-200 font-medium"
                          >
                            {line.replace(/^\d+\.\s/, '')}
                          </li>
                        );
                      }
                      if (line.trim() === '---') {
                        return (
                          <hr key={idx} className="border-stone-200 dark:border-stone-800 my-4" />
                        );
                      }
                      if (!line.trim()) {
                        return <div key={idx} className="h-2" />;
                      }
                      return (
                        <p key={idx} className="text-stone-800 dark:text-stone-200 leading-relaxed">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Copyright and Auto-save indicator */}
            <div className="h-8 px-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Guardado automático en disco
              </span>
              <span>Biblia RVR 1960 • SoyJhery</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
            <FileText className="w-12 h-12 mb-3 opacity-30 text-stone-400" />
            <h3 className="font-semibold text-stone-700 dark:text-stone-300 text-sm">
              Ninguna nota seleccionada
            </h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Selecciona una nota de la izquierda o crea un nuevo bosquejo para tus sermones y estudios.
            </p>
            <button
              onClick={() => onCreateNote()}
              className="mt-4 flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Nueva Nota</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
