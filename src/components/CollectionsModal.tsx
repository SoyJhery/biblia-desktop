import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  Plus, 
  BookOpen, 
  Trash2, 
  Edit3, 
  Check, 
  Tag, 
  FileText,
  BookmarkPlus
} from 'lucide-react';
import { Collection, CollectionItem, Book } from '../types';

interface CollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onCreateCollection: (name: string, description: string, color: string) => string;
  onDeleteCollection: (collectionId: string) => void;
  onAddItemToCollection: (collectionId: string, item: Omit<CollectionItem, 'id' | 'collectionId' | 'addedAt'>) => void;
  onRemoveItemFromCollection: (collectionId: string, itemId: string) => void;
  onUpdateItemNote: (collectionId: string, itemId: string, note: string) => void;
  onJumpToReference: (bookId: number, chapter: number, verse?: number) => void;
  currentBook: Book;
  currentChapter: number;
  pendingSelection?: {
    bookId: number;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    isFullChapter?: boolean;
    textSnippet?: string;
  } | null;
  onClearPendingSelection?: () => void;
}

const PRESET_COLORS = [
  '#0ea5e9', // Sky
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#64748b', // Slate
];

export const CollectionsModal: React.FC<CollectionsModalProps> = ({
  isOpen,
  onClose,
  collections,
  onCreateCollection,
  onDeleteCollection,
  onAddItemToCollection,
  onRemoveItemFromCollection,
  onUpdateItemNote,
  onJumpToReference,
  currentBook,
  currentChapter,
  pendingSelection,
  onClearPendingSelection,
}) => {
  const [activeCollectionId, setActiveCollectionId] = useState<string>(
    collections[0]?.id || ''
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0]);

  // Modo agregar selección pendiente
  const [targetCollectionId, setTargetCollectionId] = useState<string>(
    collections[0]?.id || ''
  );
  const [itemNote, setItemNote] = useState('');

  // Edición de nota en item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState('');

  if (!isOpen) return null;

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || collections[0];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newId = onCreateCollection(newGroupName.trim(), newGroupDesc.trim(), newGroupColor);
    setNewGroupName('');
    setNewGroupDesc('');
    setIsCreatingNew(false);
    setActiveCollectionId(newId);
    if (pendingSelection) {
      setTargetCollectionId(newId);
    }
  };

  const handleSavePendingToGroup = () => {
    if (!pendingSelection || !targetCollectionId) return;
    onAddItemToCollection(targetCollectionId, {
      bookId: pendingSelection.bookId,
      chapter: pendingSelection.chapter,
      verseStart: pendingSelection.verseStart,
      verseEnd: pendingSelection.verseEnd,
      isFullChapter: pendingSelection.isFullChapter,
      textSnippet: pendingSelection.textSnippet,
      note: itemNote.trim() || undefined,
    });
    setItemNote('');
    if (onClearPendingSelection) onClearPendingSelection();
    setActiveCollectionId(targetCollectionId);
    onClose();
  };

  const handleAddCurrentChapterToActive = () => {
    if (!activeCollection) return;
    onAddItemToCollection(activeCollection.id, {
      bookId: currentBook.id,
      chapter: currentChapter,
      verseStart: 1,
      isFullChapter: true,
      textSnippet: `${currentBook.name} Capítulo ${currentChapter} completo.`,
      note: `Capítulo agregado el ${new Date().toLocaleDateString()}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl h-[85vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {pendingSelection ? 'Añadir Pasaje a un Grupo' : 'Grupos y Colecciones de Estudio'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Organiza versículos y capítulos por temas, promesas o motivos de oración
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onClearPendingSelection) onClearPendingSelection();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Mode A (Add Pending Selection) vs Mode B (Manage Collections) */}
        {pendingSelection ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-xl mx-auto w-full">
            {/* Target Snippet Preview */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <BookmarkPlus className="w-4 h-4" />
                {pendingSelection.isFullChapter
                  ? `Capítulo Completo`
                  : `Versículo(s) Seleccionado(s)`}
              </span>
              <p className="mt-2 text-sm italic font-serif text-stone-700 dark:text-stone-300">
                "{pendingSelection.textSnippet}"
              </p>
            </div>

            {/* Choose Group */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Selecciona el Grupo / Carpeta de Destino:
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isCreatingNew ? 'Cancelar nuevo' : 'Crear nuevo grupo'}
                </button>
              </div>

              {/* Form Crear Nuevo Grupo Rápido */}
              {isCreatingNew && (
                <div className="mb-4 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Nombre del grupo (ej: Sanidad, Gratitud, Liderazgo)..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Color:</span>
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewGroupColor(col)}
                        className={`w-6 h-6 rounded-full border transition-transform ${
                          newGroupColor === col ? 'scale-125 ring-2 ring-amber-500' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    className="self-end px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    Crear y Seleccionar
                  </button>
                </div>
              )}

              {/* Group Selector List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {collections.map((col) => {
                  const isSelected = targetCollectionId === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setTargetCollectionId(col.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-850'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: col.color }}
                      />
                      <div className="flex-1 truncate">
                        <p className="font-semibold text-xs truncate">{col.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{col.items.length} elementos</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                Nota personal o reflexión (Opcional):
              </label>
              <textarea
                rows={3}
                placeholder="Escribe por qué guardas este pasaje, o una aplicación práctica personal..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onClearPendingSelection) onClearPendingSelection();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePendingToGroup}
                disabled={!targetCollectionId}
                className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                Guardar en Grupo
              </button>
            </div>
          </div>
        ) : (
          /* Normal Management Mode: Two-column master/detail */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar with Collection Folders */}
            <div className="w-full md:w-72 border-r border-stone-200 dark:border-stone-800 flex flex-col bg-stone-50/50 dark:bg-stone-900/40">
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Tus Grupos ({collections.length})
                </span>
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo
                </button>
              </div>

              {/* Create new inline */}
              {isCreatingNew && (
                <form onSubmit={handleCreateGroup} className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del grupo..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    autoFocus
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Descripción breve (opcional)..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewGroupColor(col)}
                          className={`w-4 h-4 rounded-full border ${
                            newGroupColor === col ? 'scale-125 ring-2 ring-amber-500' : ''
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingNew(false)}
                        className="px-2 py-1 text-[11px] text-stone-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newGroupName.trim()}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50"
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Collections list */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {collections.map((col) => {
                  const isActive = col.id === activeCollection?.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setActiveCollectionId(col.id)}
                      className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 font-semibold'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: col.color }}
                        />
                        <span className="text-xs truncate">{col.name}</span>
                      </div>
                      <span className="text-[11px] text-stone-400 px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-850">
                        {col.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Area: Items inside active collection */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-stone-900">
              {activeCollection ? (
                <>
                  {/* Collection Header Bar */}
                  <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/30 dark:bg-stone-900/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: activeCollection.color }}
                        />
                        <h3 className="text-base font-bold">{activeCollection.name}</h3>
                      </div>
                      {activeCollection.description && (
                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                          {activeCollection.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quick Add current chapter button */}
                      <button
                        onClick={handleAddCurrentChapterToActive}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors border border-amber-500/20"
                        title="Agrega el capítulo completo que estás leyendo actualmente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ {currentBook.name} {currentChapter}</span>
                      </button>

                      {/* Delete collection button */}
                      {collections.length > 1 && (
                        <button
                          onClick={() => onDeleteCollection(activeCollection.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-colors"
                          title="Eliminar este grupo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                    {activeCollection.items.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
                        <Tag className="w-10 h-10 mb-2 stroke-1 opacity-50" />
                        <p className="text-sm font-medium">Este grupo está vacío</p>
                        <p className="text-xs max-w-sm mt-1 text-stone-500">
                          Selecciona cualquier versículo en la Biblia y usa el botón "Agrupar", o haz clic arriba en "+ {currentBook.name} {currentChapter}" para agregar el capítulo actual.
                        </p>
                      </div>
                    ) : (
                      activeCollection.items.map((item) => {
                        const isEditingThis = editingItemId === item.id;
                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/60 hover:border-amber-400/50 transition-all flex flex-col gap-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
                                  {item.isFullChapter
                                    ? `Capítulo ${item.chapter} Completo`
                                    : item.verseEnd && item.verseEnd !== item.verseStart
                                    ? `Capítulo ${item.chapter}:${item.verseStart}-${item.verseEnd}`
                                    : `Capítulo ${item.chapter}:${item.verseStart}`}
                                </span>
                                {item.isFullChapter && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                                    Capítulo
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    onJumpToReference(item.bookId, item.chapter, item.verseStart);
                                    onClose();
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-750 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>Leer</span>
                                </button>

                                <button
                                  onClick={() => onRemoveItemFromCollection(activeCollection.id, item.id)}
                                  className="p-1 rounded-md hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-colors"
                                  title="Quitar de este grupo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Snippet */}
                            {item.textSnippet && (
                              <p className="text-xs text-stone-600 dark:text-stone-300 italic font-serif border-l-2 border-amber-500/50 pl-2.5 my-1">
                                "{item.textSnippet}"
                              </p>
                            )}

                            {/* Personal Note */}
                            <div className="mt-1 pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-start justify-between gap-2">
                              {isEditingThis ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editedNote}
                                    onChange={(e) => setEditedNote(e.target.value)}
                                    placeholder="Escribe una nota o comentario..."
                                    className="flex-1 px-2.5 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      onUpdateItemNote(activeCollection.id, item.id, editedNote);
                                      setEditingItemId(null);
                                    }}
                                    className="p-1 rounded bg-amber-500 text-white"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 flex-1">
                                  <FileText className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                                  <span className="italic">
                                    {item.note || 'Sin nota de estudio...'}
                                  </span>
                                </div>
                              )}

                              {!isEditingThis && (
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditedNote(item.note || '');
                                  }}
                                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Editar nota de estudio"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
