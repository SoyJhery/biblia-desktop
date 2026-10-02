import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Underline,
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
  Type,
  Minus,
  Tv,
} from 'lucide-react';
import { StudyNote, LinkedVerse } from '../types';
import { projectorService } from '../services/projectorService';

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

function processInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

/**
 * Limpia y normaliza el contenido HTML de la nota:
 * 1. Rescata y desenclava cualquier tarjeta bíblica (.verse-box) si quedó accidentalmente dentro de un <h1>, <h2> o <h3>.
 * 2. Elimina cualquier encabezado <h1> o <h2> al inicio del contenido que duplique el título del bosquejo,
 *    ya que el título se gestiona en la cabecera principal y en la portada del púlpito.
 */
export function cleanHtmlContent(content: string, noteTitle?: string): string {
  if (!content) return '<p><br></p>';
  let cleaned = content.trim();

  // 1. Extraer <div class="verse-box">...</div> si accidentalmente quedó atrapada dentro de un <h1-h6>
  cleaned = cleaned.replace(/<h([1-6])[^>]*>([\s\S]*?)<div class="verse-box"([\s\S]*?)<\/div>([\s\S]*?)<\/h\1>/gi, (_m, hLevel, before, boxContent, after) => {
    const parts: string[] = [];
    const cleanBefore = before.replace(/<[^>]+>/g, '').trim();
    const cleanAfter = after.replace(/<[^>]+>/g, '').trim();

    if (cleanBefore && (!noteTitle || cleanBefore.toLowerCase() !== noteTitle.toLowerCase())) {
      parts.push(`<h${hLevel}>${cleanBefore}</h${hLevel}>`);
    }
    parts.push(`<div class="verse-box"${boxContent}</div><p><br></p>`);
    if (cleanAfter && (!noteTitle || cleanAfter.toLowerCase() !== noteTitle.toLowerCase())) {
      parts.push(`<h${hLevel}>${cleanAfter}</h${hLevel}>`);
    }
    return parts.join('\n');
  });

  // 2. Extraer todas las tarjetas bíblicas para deduplicación inteligente por índice
  // Si hay tarjetas repetidas o una genérica ("Mateo Cap. 1") y otra específica ("Mateo 1:5-8"),
  // la tarjeta inferior prevalece y se eliminan las copias redundantes superiores.
  const verseBoxRegex = /<div class="verse-box"[^>]*>[\s\S]*?<div class="verse-ref">([\s\S]*?)<\/div>\s*<\/div>\s*(<p><br\/?><\/p>)?/gi;
  interface CardInfo {
    index: number;
    fullMatch: string;
    chapterKey: string;
  }
  const cards: CardInfo[] = [];
  let m: RegExpExecArray | null;
  let cardIndex = 0;
  while ((m = verseBoxRegex.exec(cleaned)) !== null) {
    const rawRef = m[1].replace(/<[^>]+>/g, '').replace(/📖|—|Reina-Valera 1960/gi, '').trim();
    const normMatch = rawRef.match(/^([1-3]?\s*[a-záéíóúñ]+)\s*(?:cap\.?|c\.)?\s*(\d+)/i);
    const chapterKey = normMatch ? `${normMatch[1].toLowerCase().trim()} ${normMatch[2]}` : rawRef.toLowerCase();
    cards.push({
      index: cardIndex++,
      fullMatch: m[0],
      chapterKey,
    });
  }

  // Marcar los índices superiores (anteriores) para eliminar, preservando la tarjeta inferior
  const indicesToRemove = new Set<number>();
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].chapterKey === cards[j].chapterKey) {
        indicesToRemove.add(cards[i].index);
      }
    }
  }

  let matchCounter = 0;
  cleaned = cleaned.replace(/<div class="verse-box"[^>]*>[\s\S]*?<div class="verse-ref">([\s\S]*?)<\/div>\s*<\/div>\s*(<p><br\/?><\/p>)?/gi, (fullBox) => {
    const shouldRemove = indicesToRemove.has(matchCounter);
    matchCounter++;
    return shouldRemove ? '' : fullBox;
  });

  // 3. Limpiar párrafos vacíos y saltos al inicio
  cleaned = cleaned.replace(/^(\s*<p><br\/?><\/p>\s*)+/gi, '');

  // 4. Si existe un encabezado que contiene o equivale al título, o el título por defecto, removerlo
  const escaped = (noteTitle || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped ? `(${escaped}|Nuevo Bosquejo( de Estudio)?)` : `Nuevo Bosquejo( de Estudio)?`;
  const titleRegex = new RegExp(`(^|\\n|\\s*)<h[1-2][^>]*>\\s*${pattern}\\s*<\\/h[1-2]>\\s*(<p><br\\/?><\\/p>)?`, 'gi');
  cleaned = cleaned.replace(titleRegex, '$1');
  const mdTitleRegex = new RegExp(`(^|\\n|\\s*)#{1,2}\\s*${pattern}\\s*(\n|$)`, 'gi');
  cleaned = cleaned.replace(mdTitleRegex, '$1');

  // 5. Normalizar estructura de párrafos editables:
  // Asegurar que tras cada tarjeta (.verse-box) exista un párrafo editable (<p><br></p>)
  cleaned = cleaned.replace(/(<div class="verse-box"[\s\S]*?<\/div>\s*<\/div>)\s*(?!<p>)/gi, '$1\n<p><br></p>\n');
  cleaned = cleaned.replace(/(<p><br\/?><\/p>\s*){2,}/gi, '<p><br></p>\n');
  cleaned = cleaned.replace(/(\s*<p><br\/?><\/p>\s*)+$/gi, '\n<p><br></p>');

  // 6. Asegurar SIEMPRE que termine en al menos un párrafo editable para que el usuario pueda escribir
  if (!cleaned.endsWith('<p><br></p>')) {
    cleaned = cleaned.trim() + '\n<p><br></p>';
  }

  return cleaned.trim() || '<p><br></p>';
}

/**
 * Convierte notas en formato markdown o mixto a HTML enriquecido visual
 * de forma robusta para que nunca se rompan los estilos ni se muestren símbolos crudos.
 */
export function ensureHtmlContent(content: string): string {
  if (!content) return '<p><br></p>';

  const lines = content.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Si ya es un bloque HTML (como verse-box, blockquote, hr, p, h1-h6, div, ul, ol), pasarlo intacto
    if (/^<(div|blockquote|p|h[1-6]|ul|ol|li|hr)/i.test(trimmed) || /<\/(div|blockquote|p|h[1-6]|ul|ol|li)>/i.test(trimmed)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(rawLine);
      continue;
    }

    if (trimmed.startsWith('# ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h1>${processInline(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h2>${processInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h3>${processInline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('> ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<blockquote>${processInline(trimmed.slice(2))}</blockquote>`);
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) {
        result.push('<ul>');
        inUl = true;
      }
      result.push(`<li>${processInline(trimmed.slice(2))}</li>`);
      continue;
    } else if (inUl && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
      result.push('</ul>');
      inUl = false;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) {
        result.push('<ol>');
        inOl = true;
      }
      result.push(`<li>${processInline(trimmed.replace(/^\d+\.\s/, ''))}</li>`);
      continue;
    } else if (inOl && !/^\d+\.\s/.test(trimmed)) {
      result.push('</ol>');
      inOl = false;
    }

    if (trimmed === '---') {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push('<hr>');
      continue;
    }

    if (!trimmed) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push('<p><br></p>');
      continue;
    }

    // Párrafo de texto común
    result.push(`<p>${processInline(trimmed)}</p>`);
  }

  const joined = result.join('\n');
  if (!joined.endsWith('<p><br></p>') && !joined.endsWith('</p>')) {
    return joined + '\n<p><br></p>';
  }
  return joined;
}

/**
 * Convierte el HTML visual a Markdown limpio para exportar archivos .md compatibles
 */
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  let md = html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u>(.*?)<\/u>/gi, '$1')
    .replace(/<div class="verse-box">[\s\S]*?<div class="verse-text">(.*?)<\/div>[\s\S]*?<div class="verse-ref">(.*?)<\/div>[\s\S]*?<\/div>/gi, '> "$1"\n> — **$2**\n\n')
    .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<ul.*?>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol.*?>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<hr.*?>/gi, '\n---\n\n')
    .replace(/<p><br\/?><\/p>/gi, '\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return md;
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
  const [viewMode, setViewMode] = useState<'edit' | 'pulpit'>('edit');
  const [copied, setCopied] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [localTitle, setLocalTitle] = useState('');

  // Active Note
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);
  const currentNoteIdRef = useRef<string | null>(null);
  const lastContentRef = useRef<string>('');
  const activeNoteRef = useRef<StudyNote | null>(null);
  activeNoteRef.current = activeNote;
  const lastCaretRangeRef = useRef<Range | null>(null);

  // Capturar posición deliberada del cursor dentro del editor
  const saveCaretPosition = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      lastCaretRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Sincronizar título local y HTML cuando cambia la nota seleccionada
  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title || '');
      // Si cambiamos de nota, cargar el contenido limpio
      if (currentNoteIdRef.current !== activeNote.id) {
        currentNoteIdRef.current = activeNote.id;
        const cleaned = cleanHtmlContent(activeNote.content || '', activeNote.title);
        lastContentRef.current = cleaned;
        if (editorRef.current) {
          editorRef.current.innerHTML = ensureHtmlContent(cleaned);
        }
      }
    } else {
      currentNoteIdRef.current = null;
      lastContentRef.current = '';
      setLocalTitle('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [activeNote?.id]);

  // Si activeNote.content cambia externamente (ej: al insertar un versículo desde el lector bíblico o en modo púlpito)
  useEffect(() => {
    if (!activeNote) return;
    if (activeNote.content !== lastContentRef.current) {
      const cleaned = cleanHtmlContent(activeNote.content || '', activeNote.title);
      lastContentRef.current = activeNote.content;
      // Solo actualizar el DOM si el usuario no tiene el cursor activo escribiendo dentro
      if (editorRef.current && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = ensureHtmlContent(cleaned);
      }
    }
  }, [activeNote?.content]);

  // Manejar cambio suave entre modo Edición y modo Púlpito sin perder versículos ni cambios
  const handleSwitchViewMode = (newMode: 'edit' | 'pulpit') => {
    if (newMode === viewMode) return;

    if (viewMode === 'edit') {
      if (editorRef.current && activeNote) {
        const currentHtml = editorRef.current.innerHTML;
        lastContentRef.current = currentHtml;
        persistChanges(currentHtml);
      }
    } else if (newMode === 'edit') {
      setTimeout(() => {
        if (editorRef.current && activeNote) {
          const cleaned = cleanHtmlContent(activeNote.content || '', activeNote.title);
          editorRef.current.innerHTML = ensureHtmlContent(cleaned);
        }
      }, 30);
    }

    setViewMode(newMode);
  };

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

  // Guardar cambios con debounce para que el teclado responda a 60fps sin re-renderizar la app entera
  const persistChanges = useCallback(
    (newContent?: string, newTitle?: string) => {
      const current = activeNoteRef.current;
      if (!current) return;
      const contentToSave = newContent !== undefined ? newContent : (editorRef.current ? editorRef.current.innerHTML : current.content);
      const titleToSave = newTitle !== undefined ? newTitle : (localTitle || current.title);

      onUpdateNote({
        ...current,
        title: titleToSave,
        content: contentToSave,
        updatedAt: new Date().toISOString(),
      });
    },
    [localTitle, onUpdateNote]
  );

  // Manejador de entrada de texto directo en el editor visual con debounce suave
  const handleEditorInput = () => {
    const current = activeNoteRef.current;
    if (!editorRef.current || !current) return;
    const html = editorRef.current.innerHTML;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistChanges(html);
    }, 600);
  };

  // Al salir del editor (blur), persistir de inmediato
  const handleEditorBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const current = activeNoteRef.current;
    if (editorRef.current && current) {
      persistChanges(editorRef.current.innerHTML);
    }
  };

  // Actualizar título con debounce
  const handleTitleChange = (val: string) => {
    setLocalTitle(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistChanges(undefined, val);
    }, 600);
  };

  // Comandos de formateo visual nativo
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  // Formato de bloques: Título 1, Título 2, Subtítulo 3, Cita, Párrafo Normal
  const applyBlockFormat = (tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    handleEditorInput();
  };

  // Insertar un bloque HTML (como una tarjeta bíblica) de manera limpia y garantizando un párrafo editable activo
  const insertVerseBlock = (htmlToInsert: string, newRef?: string) => {
    if (!editorRef.current) return;

    // Extraer libro y capítulo de la nueva referencia si viene especificada (ej. "mateo 1")
    let newChapterKey = '';
    if (newRef) {
      const match = newRef.match(/^([1-3]?\s*[a-záéíóúñ]+)\s*(?:cap\.?|c\.)?\s*(\d+)/i);
      if (match) newChapterKey = `${match[1].toLowerCase().trim()} ${match[2]}`;
    }

    // Comprobar si el editor ya contiene una tarjeta previa de este mismo capítulo o si solo contiene una tarjeta previa sin notas de usuario
    const existingBoxes = Array.from(editorRef.current.querySelectorAll('.verse-box'));
    let boxToReplace: Element | null = null;

    if (existingBoxes.length > 0) {
      const textWithoutBoxes = editorRef.current.textContent?.replace(/\s+/g, '') || '';
      const boxesText = existingBoxes.map((b) => b.textContent?.replace(/\s+/g, '') || '').join('');
      const onlyHasBoxes = textWithoutBoxes === boxesText;

      for (const box of existingBoxes) {
        const refEl = box.querySelector('.verse-ref');
        const boxRefText = refEl?.textContent || '';
        const match = boxRefText.match(/^([1-3]?\s*[a-záéíóúñ]+)\s*(?:cap\.?|c\.)?\s*(\d+)/i);
        const boxKey = match ? `${match[1].toLowerCase().trim()} ${match[2]}` : '';

        if (onlyHasBoxes || (newChapterKey && boxKey === newChapterKey)) {
          boxToReplace = box;
          break;
        }
      }
    }

    if (boxToReplace) {
      // Reemplazar la tarjeta previa directamente para no acumular versículos arriba y abajo
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlToInsert;
      const newBox = tempDiv.firstElementChild;
      if (newBox) {
        boxToReplace.replaceWith(newBox);
      }
      // Asegurar que exista un párrafo después de la tarjeta para escribir
      let nextP = newBox?.nextElementSibling as HTMLElement;
      if (!nextP || nextP.tagName !== 'P') {
        nextP = document.createElement('p');
        nextP.innerHTML = '<br>';
        newBox?.after(nextP);
      }
      editorRef.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(nextP);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      handleEditorInput();
      return;
    }

    // Verificar si el editor está vacío o solo contiene un salto de párrafo vacío
    const currentText = (editorRef.current.textContent || '').trim();
    const currentHtml = editorRef.current.innerHTML.trim();
    const isEmpty = !currentHtml || currentHtml === '<p><br></p>' || currentHtml === '<br>' || (!currentText && existingBoxes.length === 0);

    if (isEmpty) {
      editorRef.current.innerHTML = htmlToInsert;
      let nextP = editorRef.current.querySelector('p:last-of-type') as HTMLElement;
      if (!nextP) {
        nextP = document.createElement('p');
        nextP.innerHTML = '<br>';
        editorRef.current.appendChild(nextP);
      }
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(nextP);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      handleEditorInput();
      return;
    }

    // Intentar restaurar la selección previa guardada si existe y sigue dentro del editor
    let range: Range | null = null;
    const sel = window.getSelection();

    if (lastCaretRangeRef.current && editorRef.current.contains(lastCaretRangeRef.current.commonAncestorContainer)) {
      range = lastCaretRangeRef.current;
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0);
    }

    // Si el cursor está en el offset 0 del editor o no hay un rango explícito dentro de un elemento hijo específico:
    const isAtStartContainer = range && (range.commonAncestorContainer === editorRef.current && range.startOffset === 0);
    if (!range || isAtStartContainer) {
      editorRef.current.insertAdjacentHTML('beforeend', htmlToInsert);
    } else {
      let blockParent: Node | null = range.commonAncestorContainer;
      if (blockParent.nodeType === Node.TEXT_NODE) {
        blockParent = blockParent.parentElement;
      }

      const containerBlock = (blockParent as HTMLElement)?.closest?.('h1, h2, h3, h4, h5, h6, .verse-box');
      const pBlock = (blockParent as HTMLElement)?.closest?.('p');

      if (containerBlock && editorRef.current.contains(containerBlock)) {
        containerBlock.insertAdjacentHTML('afterend', htmlToInsert);
      } else if (pBlock && editorRef.current.contains(pBlock) && (!pBlock.textContent || !pBlock.textContent.trim())) {
        pBlock.insertAdjacentHTML('beforebegin', htmlToInsert);
        pBlock.remove();
      } else if (pBlock && editorRef.current.contains(pBlock)) {
        pBlock.insertAdjacentHTML('afterend', htmlToInsert);
      } else {
        editorRef.current.insertAdjacentHTML('beforeend', htmlToInsert);
      }
    }

    // Asegurar que siempre exista un párrafo editable al final o después de la inserción y enfocarlo
    let targetP = editorRef.current.querySelector('p:last-of-type') as HTMLElement;
    if (!targetP) {
      targetP = document.createElement('p');
      targetP.innerHTML = '<br>';
      editorRef.current.appendChild(targetP);
    }
    editorRef.current.focus();
    const newRange = document.createRange();
    newRange.selectNodeContents(targetP);
    newRange.collapse(false);
    const newSel = window.getSelection();
    newSel?.removeAllRanges();
    newSel?.addRange(newRange);
    handleEditorInput();
  };

  // Inserción de pasaje bíblico visual estilizado
  const handleInsertCurrentPassage = () => {
    const current = activeNoteRef.current || activeNote;
    if (!current) return;

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

    // Cancelar cualquier guardado debounce pendiente para prevenir condiciones de carrera
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Comprobar idempotencia: Si el pasaje ya existe en el contenido, no duplicar la tarjeta visual
    const existingContent = current.content || (editorRef.current ? editorRef.current.innerHTML : '');
    const isAlreadyPresent = existingContent.toLowerCase().includes(refText.toLowerCase());

    // Registrar en pasajes vinculados reemplazando enlaces previos del mismo capítulo para evitar badges duplicados
    const sorted = selectedVerses.length > 0 ? [...selectedVerses].sort((a, b) => a - b) : [1];
    const vStart = sorted[0];
    const vEnd = sorted[sorted.length - 1];

    const filteredLinks = (current.linkedVerses || []).filter(
      (lv) => !(lv.bookId === currentBookId && lv.chapter === currentChapter)
    );

    const newLink: LinkedVerse = {
      id: `link-${Date.now()}`,
      bookId: currentBookId,
      chapter: currentChapter,
      verseStart: vStart,
      verseEnd: vEnd > vStart ? vEnd : undefined,
      reference: refText,
      textSnippet: snippet.slice(0, 120),
    };
    const updatedLinked = [...filteredLinks, newLink];

    if (isAlreadyPresent) {
      // Si la tarjeta ya existe en el cuerpo de la nota, no duplicar; solo actualizar los metadatos de enlaces si hacía falta
      if (!alreadyLinked) {
        onUpdateNote({
          ...current,
          linkedVerses: updatedLinked,
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    // Tarjeta visual editorial del pasaje (sin símbolos de código ni markdown)
    const visualScriptureHtml = `
      <div class="verse-box" contenteditable="false">
        <div class="verse-text">“${snippet}”</div>
        <div class="verse-ref">📖 ${refText} — Reina-Valera 1960</div>
      </div>
      <p><br></p>
    `;

    // Si estamos en modo púlpito o editorRef no está montado, añadir al contenido visual directamente
    if (viewMode === 'pulpit' || !editorRef.current) {
      const currentHtml = cleanHtmlContent(current.content || '', current.title);
      const newContent = cleanHtmlContent(currentHtml + '\n' + visualScriptureHtml, current.title);
      lastContentRef.current = newContent;
      onUpdateNote({
        ...current,
        content: newContent,
        linkedVerses: updatedLinked,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Modo edición activo: insertar en el cursor o reemplazar tarjeta previa
      insertVerseBlock(visualScriptureHtml, refText);
      const newContent = cleanHtmlContent(editorRef.current.innerHTML, current.title);
      lastContentRef.current = newContent;
      onUpdateNote({
        ...current,
        content: newContent,
        linkedVerses: updatedLinked,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Vincular referencia bíblica sin alterar el texto
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

  const handleRemoveLink = (linkId: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      linkedVerses: activeNote.linkedVerses.filter((l) => l.id !== linkId),
      updatedAt: new Date().toISOString(),
    });
  };

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

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      tags: activeNote.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  // Copiar nota limpia al portapapeles
  const handleCopyNote = () => {
    if (!activeNote) return;
    const plainText = htmlToMarkdown(activeNote.content);
    const fullText = `${activeNote.title}\n\n${plainText}\n\n---\nPasajes vinculados: ${
      activeNote.linkedVerses.map((l) => l.reference).join(', ') || 'Ninguno'
    }\nEstudio creado en Biblia RVR 1960 • SoyJhery (soyjhery@gmail.com)\nCopyright © 2026 SoyJhery. Todos los derechos reservados.`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Exportar como Markdown estándar para quien lo desee
  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const sanitizedTitle = (activeNote.title || 'Bosquejo')
      .replace(/[^a-z0-9áéíóúñ_-]/gi, '_')
      .toLowerCase();
    const mdBody = htmlToMarkdown(activeNote.content);
    const content = `# ${activeNote.title}\n\n*Fecha: ${new Date(
      activeNote.updatedAt
    ).toLocaleDateString()}*\n*Etiquetas: ${activeNote.tags.join(', ')}*\n\n${mdBody}\n\n---\n### Pasajes Bíblicos Vinculados\n${activeNote.linkedVerses
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

  return (
    <aside
      className={`border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-col z-20 transition-all duration-300 shadow-xl ${
        isMaximized
          ? 'fixed inset-0 z-50 w-full h-full'
          : 'w-full lg:w-[500px] xl:w-[580px] h-[calc(100vh-3.5rem)] flex-shrink-0'
      }`}
    >
      {/* Barra superior */}
      <div className="h-14 px-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900/95 backdrop-blur-sm">
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
            title={isMaximized ? 'Restaurar panel lateral' : 'Maximizar a pantalla completa'}
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

      {/* Cuerpo principal divido: Lista de Notas a la izquierda y Editor Visual a la derecha */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna Izquierda: Selector de notas */}
        <div
          className={`flex flex-col border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 ${
            isMaximized ? 'w-72 sm:w-80' : 'w-48 sm:w-56'
          }`}
        >
          {/* Botón Nueva Nota y Búsqueda */}
          <div className="p-3 border-b border-stone-200 dark:border-stone-800 space-y-2">
            <button
              onClick={() => onCreateNote()}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Bosquejo</span>
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

            {/* Filtro por etiquetas */}
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

          {/* Lista de notas */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60 p-1.5 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-400" />
                <span>No se encontraron notas</span>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === activeNoteId;
                // Preview limpio sin etiquetas HTML
                const previewClean = note.content
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/[#*>`]/g, '')
                  .trim();

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
                      {previewClean || 'Nota vacía...'}
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

        {/* Columna Derecha: Editor Visual Estilizado (WYSIWYG) */}
        {activeNote ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-stone-900 overflow-hidden select-text">
            {/* Cabecera del Documento: Título y Modos de Vista */}
            <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-2.5 bg-stone-50/60 dark:bg-stone-850/60">
              <div className="flex items-center justify-between gap-3">
                {viewMode === 'edit' ? (
                  <input
                    type="text"
                    value={localTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onBlur={() => persistChanges(undefined, localTitle)}
                    placeholder="Título del sermón o estudio..."
                    className="flex-1 bg-transparent font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none border-b border-transparent focus:border-amber-500 pb-0.5 transition-colors"
                  />
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wide uppercase">
                      <Eye className="w-3.5 h-3.5" />
                      Modo Púlpito
                    </span>
                    <span className="text-xs text-stone-400 truncate hidden sm:inline">
                      Vista limpia para predicación
                    </span>
                  </div>
                )}

                {/* Alternador de Modo de Trabajo */}
                <div className="flex items-center bg-stone-200 dark:bg-stone-800 rounded-lg p-0.5 text-xs font-medium">
                  <button
                    onClick={() => handleSwitchViewMode('edit')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'edit'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    title="Modo Edición Visual con Herramientas de Estilo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editor</span>
                  </button>
                  <button
                    onClick={() => handleSwitchViewMode('pulpit')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'pulpit'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    title="Modo Púlpito: Lectura limpia y tipografía amplia para predicar sin distracciones"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Púlpito</span>
                  </button>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyNote}
                    className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                    title="Copiar texto del sermón al portapapeles"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                    title="Exportar archivo Markdown (.md)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                    title="Imprimir o Guardar en PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (!activeNote) return;
                      // Limpiar texto de etiquetas y formatear puntos
                      const plainText = (activeNote.content || '')
                        .replace(/<[^>]+>/g, '\n')
                        .split('\n')
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0 && !l.includes('Reina-Valera 1960'));
                      
                      const slide = projectorService.createOutlineSlide(
                        activeNote.title || 'Bosquejo Homilético',
                        plainText.slice(0, 5),
                        'Puntos de Predicación'
                      );
                      projectorService.sendSlide(slide);
                    }}
                    className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-amber-500 hover:text-amber-600 transition-colors"
                    title="Proyectar puntos del bosquejo en la segunda pantalla (HDMI)"
                  >
                    <Tv className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Deseas eliminar el bosquejo "${activeNote.title}"?`)) {
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

              {/* Etiquetas y Pasajes (Solo en Modo Edición) */}
              {viewMode === 'edit' && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
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

                  {/* Botón para insertar la tarjeta bíblica visual */}
                  <button
                    onClick={handleInsertCurrentPassage}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-all border border-amber-500/30 shadow-xs"
                    title="Inserta una tarjeta visual estilizada con el pasaje bíblico seleccionado en la posición del cursor"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>+ Insertar Versículo</span>
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
              )}

              {/* Badges de Versículos Vinculados */}
              {viewMode === 'edit' && activeNote.linkedVerses.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Pasajes Vinculados:
                  </span>
                  {activeNote.linkedVerses.map((lv) => (
                    <div
                      key={lv.id}
                      className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-300/40 dark:border-amber-700/40 shadow-2xs"
                    >
                      <button
                        onClick={() => onJumpToReference(lv.bookId, lv.chapter, lv.verseStart)}
                        className="hover:underline flex items-center gap-1"
                        title={`Navegar a ${lv.reference} en la Biblia`}
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

            {/* Barra de Herramientas de Estilo Visual (WYSIWYG) */}
            {viewMode === 'edit' && (
              <div className="px-3 py-1.5 border-b border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-850/80 flex items-center gap-1 overflow-x-auto no-scrollbar select-none">
                {/* Selector visual de Título / Estilo */}
                <div className="flex items-center gap-1 pr-1 border-r border-stone-300 dark:border-stone-700">
                  <button
                    onClick={() => applyBlockFormat('<p>')}
                    className="px-2 py-1 text-xs rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors font-medium"
                    title="Texto normal"
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => applyBlockFormat('<h1>')}
                    className="flex items-center gap-0.5 px-2 py-1 text-xs rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-amber-700 dark:text-amber-400 transition-colors font-bold"
                    title="Título Principal Grande"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                    <span>Título 1</span>
                  </button>
                  <button
                    onClick={() => applyBlockFormat('<h2>')}
                    className="flex items-center gap-0.5 px-2 py-1 text-xs rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors font-semibold"
                    title="Subtítulo / Punto del Sermón"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                    <span>Subtítulo 2</span>
                  </button>
                  <button
                    onClick={() => applyBlockFormat('<h3>')}
                    className="flex items-center gap-0.5 px-2 py-1 text-xs rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 transition-colors font-medium"
                    title="Sección Menor"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                    <span>Punto 3</span>
                  </button>
                </div>

                {/* Formato de Caracteres */}
                <div className="flex items-center gap-0.5 px-1 border-r border-stone-300 dark:border-stone-700">
                  <button
                    onClick={() => executeCommand('bold')}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors font-bold"
                    title="Negrita (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => executeCommand('italic')}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors italic"
                    title="Cursiva (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => executeCommand('underline')}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors underline"
                    title="Subrayado (Ctrl+U)"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Estructura: Listas, Citas y Separador */}
                <div className="flex items-center gap-0.5 px-1">
                  <button
                    onClick={() => executeCommand('insertUnorderedList')}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                    title="Lista con viñetas"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => executeCommand('insertOrderedList')}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                    title="Lista numerada"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => applyBlockFormat('<blockquote>')}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                    title="Cita o reflexión en bloque"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => executeCommand('insertHorizontalRule')}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                    title="Línea divisoria"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Lienzo del Editor Visual (WYSIWYG) */}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 cursor-text"
              onClick={(e) => {
                if (viewMode === 'edit' && editorRef.current) {
                  const target = e.target as HTMLElement;
                  if (target === e.currentTarget || target === editorRef.current || target.closest('.verse-box')) {
                    let lastP = editorRef.current.querySelector(':scope > p:last-of-type') as HTMLElement;
                    if (!lastP) {
                      lastP = document.createElement('p');
                      lastP.innerHTML = '<br>';
                      editorRef.current.appendChild(lastP);
                    }
                    editorRef.current.focus();
                    const range = document.createRange();
                    range.selectNodeContents(lastP);
                    range.collapse(false);
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }
                }
              }}
            >
              {viewMode === 'edit' ? (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  tabIndex={0}
                  onInput={() => {
                    saveCaretPosition();
                    handleEditorInput();
                  }}
                  onKeyUp={saveCaretPosition}
                  onMouseUp={saveCaretPosition}
                  onFocus={() => {
                    let lastP = editorRef.current?.querySelector(':scope > p:last-of-type') as HTMLElement;
                    if (!lastP && editorRef.current) {
                      lastP = document.createElement('p');
                      lastP.innerHTML = '<br>';
                      editorRef.current.appendChild(lastP);
                    }
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && lastP) {
                      const anchor = sel.anchorNode;
                      const isInsideBlock = anchor && ((anchor as HTMLElement).closest ? (anchor as HTMLElement).closest('p, h1, h2, h3, blockquote, li') : anchor.parentElement?.closest('p, h1, h2, h3, blockquote, li'));
                      if (!isInsideBlock) {
                        const range = document.createRange();
                        range.selectNodeContents(lastP);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                      }
                    }
                  }}
                  onKeyDown={(_e) => {
                    // Rescatar cursor al último párrafo si el usuario intenta escribir estando en el contenedor principal o cerca de verse-box
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && editorRef.current) {
                      const container = sel.getRangeAt(0).commonAncestorContainer;
                      const isInsideBlock = (container as HTMLElement)?.closest?.('p, h1, h2, h3, blockquote, li') ||
                                            (container.parentElement?.closest('p, h1, h2, h3, blockquote, li'));
                      if (!isInsideBlock) {
                        let lastP = editorRef.current.querySelector(':scope > p:last-of-type') as HTMLElement;
                        if (!lastP) {
                          lastP = document.createElement('p');
                          lastP.innerHTML = '<br>';
                          editorRef.current.appendChild(lastP);
                        }
                        const range = document.createRange();
                        range.selectNodeContents(lastP);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                      }
                    }
                  }}
                  onBlur={() => {
                    saveCaretPosition();
                    handleEditorBlur();
                  }}
                  data-placeholder="Comienza a escribir tu sermón, puntos de estudio o reflexiones aquí. Usa las herramientas superiores para títulos y versículos sin códigos..."
                  className="study-editor w-full min-h-[400px] text-stone-900 dark:text-stone-100 focus:outline-none select-text"
                  spellCheck="true"
                />
              ) : (
                /* Modo Púlpito: Lectura limpia, tipografía editorial grande sin barras de herramientas */
                <div className="max-w-3xl mx-auto space-y-4 text-stone-900 dark:text-stone-100 font-serif leading-relaxed text-lg sm:text-xl pulpit-view">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400 font-sans">
                      {activeNote.title || 'Bosquejo sin título'}
                    </h1>
                    <div className="flex items-center gap-2 text-xs font-sans text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(activeNote.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {activeNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-xs font-sans text-stone-500 dark:text-stone-400">
                      {activeNote.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-[11px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className="study-editor max-w-none font-serif select-text text-lg sm:text-xl leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: ensureHtmlContent(cleanHtmlContent(activeNote.content, activeNote.title)) }}
                  />
                </div>
              )}
            </div>

            {/* Pie de página con estado de guardado y firma oficial */}
            <div className="h-8 px-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Guardado automático visual</span>
              </span>
              <span>Biblia RVR 1960 • SoyJhery</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
            <FileText className="w-12 h-12 mb-3 opacity-30 text-stone-400" />
            <h3 className="font-semibold text-stone-700 dark:text-stone-300 text-sm">
              Ningún bosquejo seleccionado
            </h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Selecciona una nota de la izquierda o crea un nuevo bosquejo para tus sermones y estudios.
            </p>
            <button
              onClick={() => onCreateNote()}
              className="mt-4 flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Nuevo Bosquejo</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
