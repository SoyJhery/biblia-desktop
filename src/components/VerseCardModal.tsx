import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone, 
  Square, 
  AlignLeft, 
  AlignCenter 
} from 'lucide-react';

interface VerseCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseText: string;
  reference: string;
}

type AspectRatio = '1:1' | '9:16';
type CardTheme = 'obsidian-gold' | 'celestial-blue' | 'emerald-peace' | 'royal-purple' | 'parchment' | 'clean-modern';

interface ThemeConfig {
  id: CardTheme;
  name: string;
  bgGradStart: string;
  bgGradEnd: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  isLight?: boolean;
}

const THEMES: ThemeConfig[] = [
  {
    id: 'obsidian-gold',
    name: 'Obsidiana Dorada',
    bgGradStart: '#0c0a09',
    bgGradEnd: '#1c1917',
    textColor: '#fef3c7',
    accentColor: '#f59e0b',
    borderColor: '#78350f',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#fbbf24',
  },
  {
    id: 'celestial-blue',
    name: 'Azul Celestial',
    bgGradStart: '#030712',
    bgGradEnd: '#0f172a',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    borderColor: '#1e3a8a',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#7dd3fc',
  },
  {
    id: 'emerald-peace',
    name: 'Paz Esmeralda',
    bgGradStart: '#022c22',
    bgGradEnd: '#064e3b',
    textColor: '#ecfdf5',
    accentColor: '#34d399',
    borderColor: '#065f46',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    badgeText: '#6ee7b7',
  },
  {
    id: 'royal-purple',
    name: 'Púrpura Real',
    bgGradStart: '#1e1035',
    bgGradEnd: '#3b0764',
    textColor: '#faf5ff',
    accentColor: '#c084fc',
    borderColor: '#6b21a8',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    badgeText: '#d8b4fe',
  },
  {
    id: 'parchment',
    name: 'Papiro Clásico',
    bgGradStart: '#fdfbf7',
    bgGradEnd: '#f4e5c7',
    textColor: '#292524',
    accentColor: '#b45309',
    borderColor: '#d97706',
    badgeBg: 'rgba(180, 83, 9, 0.12)',
    badgeText: '#92400e',
    isLight: true,
  },
  {
    id: 'clean-modern',
    name: 'Minimalista Blanco',
    bgGradStart: '#ffffff',
    bgGradEnd: '#f1f5f9',
    textColor: '#0f172a',
    accentColor: '#475569',
    borderColor: '#cbd5e1',
    badgeBg: 'rgba(71, 85, 105, 0.1)',
    badgeText: '#334155',
    isLight: true,
  },
];

export const VerseCardModal: React.FC<VerseCardModalProps> = ({
  isOpen,
  onClose,
  verseText,
  reference,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('obsidian-gold');
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans'>('serif');
  const [textAlign, setTextAlign] = useState<'center' | 'left'>('center');
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentThemeConfig = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  // Algoritmo de ajuste de texto en canvas
  const drawCardToCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === '1:1' ? 1080 : 1920;

    canvas.width = width;
    canvas.height = height;

    // 1. Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, currentThemeConfig.bgGradStart);
    grad.addColorStop(1, currentThemeConfig.bgGradEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Borde decorativo fino
    ctx.strokeStyle = currentThemeConfig.borderColor;
    ctx.lineWidth = 3;
    const margin = 50;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    // Esquinas decorativas
    const cornerSize = 25;
    ctx.lineWidth = 6;
    ctx.strokeStyle = currentThemeConfig.accentColor;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(margin, margin + cornerSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + cornerSize, margin);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, margin + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(margin, height - margin - cornerSize);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(margin + cornerSize, height - margin);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(width - margin, height - margin - cornerSize);
    ctx.stroke();

    // 3. Icono sagrado superior (Cruz o Adorno)
    ctx.fillStyle = currentThemeConfig.accentColor;
    ctx.beginPath();
    const centerX = width / 2;
    const startY = aspectRatio === '1:1' ? 140 : 280;
    ctx.arc(centerX, startY, 6, 0, Math.PI * 2);
    ctx.fill();

    // 4. Texto del Versículo con ajuste automático de líneas
    const fontFamily = fontStyle === 'serif' ? 'Merriweather, Georgia, serif' : 'Inter, sans-serif';
    
    let baseFontSize = textSize === 'sm' ? 44 : textSize === 'md' ? 52 : 62;
    if (aspectRatio === '9:16') {
      baseFontSize += 4;
    }
    if (verseText.length > 250) {
      baseFontSize -= 10;
    }

    ctx.font = `italic ${baseFontSize}px ${fontFamily}`;
    ctx.fillStyle = currentThemeConfig.textColor;
    ctx.textAlign = textAlign === 'center' ? 'center' : 'left';
    ctx.textBaseline = 'middle';

    const maxTextWidth = width - 240;
    const words = `“${verseText.trim()}”`.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxTextWidth && currentLine) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = baseFontSize * 1.5;
    const totalBlockHeight = lines.length * lineHeight;
    let textStartY = (height - totalBlockHeight) / 2 - 20;

    const textX = textAlign === 'center' ? width / 2 : 120;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], textX, textStartY + i * lineHeight);
    }

    // 5. Cita Bíblica (Referencia)
    const refY = textStartY + lines.length * lineHeight + 60;
    ctx.font = `bold 36px ${fontFamily}`;
    ctx.fillStyle = currentThemeConfig.accentColor;
    ctx.textAlign = 'center';
    ctx.fillText(`— ${reference.toUpperCase()} (RVR1960) —`, width / 2, refY);

    // 6. Pie de página Oficial SoyJhery
    const footerY = height - 100;
    ctx.font = `500 24px Inter, sans-serif`;
    ctx.fillStyle = currentThemeConfig.isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('📖 Biblia RVR 1960 • Una app de SoyJhery', width / 2, footerY);
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawCardToCanvas(canvasRef.current);
    }
  }, [isOpen, aspectRatio, selectedTheme, fontStyle, textAlign, textSize, verseText, reference]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    const link = document.createElement('a');
    const safeRef = reference.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Versiculo_${safeRef}_SoyJhery.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
    setIsExporting(false);
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setIsExporting(false);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Error al copiar imagen:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row overflow-hidden text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Live Canvas Preview */}
        <div className="flex-1 bg-stone-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Header Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 text-[11px] font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estudio Visual SoyJhery</span>
          </div>

          {/* Canvas Wrapper */}
          <div className="max-h-[60vh] md:max-h-[72vh] flex items-center justify-center w-full">
            <canvas
              ref={canvasRef}
              className={`rounded-2xl shadow-2xl transition-all duration-300 max-h-[58vh] max-w-[90%] object-contain ${
                aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[9/16]'
              }`}
            />
          </div>
        </div>

        {/* Right Side: Design Controls */}
        <div className="w-full md:w-96 p-6 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight">Estudio de Tarjetas</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Crea y comparte versículos estéticos
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Formato / Aspect Ratio */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Formato de Redes
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    aspectRatio === '1:1'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/30'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span>1:1 (Post)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    aspectRatio === '9:16'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/30'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>9:16 (Historia/Status)</span>
                </button>
              </div>
            </div>

            {/* 2. Temas de Fondo */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Estilo Visual & Fondo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setSelectedTheme(th.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      selectedTheme === th.id
                        ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-xs font-semibold'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-850'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${th.bgGradStart}, ${th.bgGradEnd})` }}
                    />
                    <span className="text-[11px] truncate text-stone-700 dark:text-stone-300">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tipografía y Alineación */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Tipografía y Alineación
              </label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setFontStyle('serif')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-serif font-bold transition-all ${
                    fontStyle === 'serif'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Serif Clásico
                </button>
                <button
                  onClick={() => setFontStyle('sans')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-sans font-bold transition-all ${
                    fontStyle === 'sans'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Sans Moderno
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                  <button
                    onClick={() => setTextAlign('center')}
                    className={`flex-1 py-1 flex items-center justify-center transition-colors ${
                      textAlign === 'center' ? 'bg-amber-500/20 text-amber-500' : 'text-stone-400'
                    }`}
                    title="Centrado"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTextAlign('left')}
                    className={`flex-1 py-1 flex items-center justify-center transition-colors ${
                      textAlign === 'left' ? 'bg-amber-500/20 text-amber-500' : 'text-stone-400'
                    }`}
                    title="Alineado a la izquierda"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 flex rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden text-xs font-bold">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setTextSize(sz)}
                      className={`flex-1 py-1 uppercase transition-colors ${
                        textSize === sz ? 'bg-amber-500/20 text-amber-500' : 'text-stone-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-2 mt-4">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Imagen en HD (PNG)</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={isExporting}
              className="w-full py-2 px-4 rounded-xl border border-stone-200 dark:border-stone-750 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Imagen copiada al portapapeles!' : 'Copiar Imagen Directa'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
