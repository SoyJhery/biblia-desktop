import React from 'react';
import { 
  X, 
  Sliders, 
  Moon, 
  Sun, 
  Coffee, 
  Download, 
  Upload, 
  Type, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { ThemeMode, ReaderFont, UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold">Ajustes de Lectura y Datos</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* 1. Theme Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-3">
              Tema Visual
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  settings.theme === 'dark'
                    ? 'border-amber-500 bg-stone-950 text-amber-400 ring-2 ring-amber-500/20 shadow-md'
                    : 'border-stone-300 dark:border-stone-750 bg-stone-900 text-stone-300 hover:border-stone-400'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>Oscuro</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ theme: 'sepia' })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  settings.theme === 'sepia'
                    ? 'border-amber-600 bg-[#fbf0d9] text-[#433422] ring-2 ring-amber-600/20 shadow-md'
                    : 'border-stone-300 dark:border-stone-750 bg-[#fbf0d9]/80 text-[#433422] hover:border-stone-400'
                }`}
              >
                <Coffee className="w-5 h-5" />
                <span>Sepia / Papiro</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  settings.theme === 'light'
                    ? 'border-amber-500 bg-white text-stone-900 ring-2 ring-amber-500/20 shadow-md'
                    : 'border-stone-300 dark:border-stone-750 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>Claro</span>
              </button>
            </div>
          </div>

          {/* 2. Typography Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-3">
              Tipografía del Lector
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => onUpdateSettings({ fontFamily: 'serif' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.fontFamily === 'serif'
                    ? 'border-amber-500 bg-amber-500/10 font-bold'
                    : 'border-stone-200 dark:border-stone-750 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                <span className="font-serif text-base block mb-0.5">Merriweather / Serif</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">Estilo bíblico clásico y elegante</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ fontFamily: 'sans' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.fontFamily === 'sans'
                    ? 'border-amber-500 bg-amber-500/10 font-bold'
                    : 'border-stone-200 dark:border-stone-750 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                <span className="font-sans text-base block mb-0.5">Inter / Sans-Serif</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">Diseño limpio y contemporáneo</span>
              </button>
            </div>

            {/* Font Size Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-stone-500 dark:text-stone-400">Tamaño del Texto</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min={15}
                max={28}
                step={1}
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Line Height Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-stone-500 dark:text-stone-400">Espaciado de Líneas</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{settings.lineHeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={1.5}
                max={2.3}
                step={0.05}
                value={settings.lineHeight}
                onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Verse numbers toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50">
              <span className="text-xs font-semibold">Mostrar números de versículo</span>
              <input
                type="checkbox"
                checked={settings.showVerseNumbers}
                onChange={(e) => onUpdateSettings({ showVerseNumbers: e.target.checked })}
                className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
              />
            </div>
          </div>

          {/* 3. Backup & Security */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-3">
              Gestión de Datos y Respaldos
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onExportBackup}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-750 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Exportar Respaldo (.json)</span>
              </button>

              <button
                onClick={onImportBackup}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-750 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-500" />
                <span>Restaurar Respaldo</span>
              </button>
            </div>
          </div>

          {/* About */}
          <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/50 text-[11px] text-stone-500 dark:text-stone-400 flex flex-col gap-1 text-center">
            <p className="font-semibold text-stone-700 dark:text-stone-300">Biblia RVR 1960 Desktop • v0.1.0</p>
            <p>Traducción Reina-Valera 1960. 66 Libros • 1,189 Capítulos • 31,104 Versículos.</p>
            <p>100% Offline • Multiplataforma para Windows (.exe) y Linux.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
