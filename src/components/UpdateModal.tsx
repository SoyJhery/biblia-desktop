import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  GitBranch, 
  GitCommit, 
  AlertCircle, 
  ShieldCheck, 
  ArrowUpCircle, 
  Terminal, 
  Key, 
  Sparkles 
} from 'lucide-react';
import { UpdateCheckResult } from '../types';
import { updateService } from '../services/updateService';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedGithubToken?: string;
  onSaveGithubToken?: (token: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  savedGithubToken = '',
  onSaveGithubToken,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyLog, setApplyLog] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  
  // Token de GitHub para repositorios privados (opcional)
  const [tokenInput, setTokenInput] = useState(savedGithubToken);
  const [showTokenField, setShowTokenField] = useState(false);

  // Comprobar automáticamente al abrir el modal si no se ha comprobado aún
  useEffect(() => {
    if (isOpen) {
      handleCheckUpdates();
    }
  }, [isOpen]);

  // Manejo de tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isApplying) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isApplying, onClose]);

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    setApplyLog(null);
    setApplyError(null);
    setApplySuccess(false);

    try {
      const res = await updateService.checkForUpdates(tokenInput.trim() || undefined);
      setUpdateResult(res);
    } catch (err: any) {
      setUpdateResult({
        hasUpdate: false,
        mode: 'none',
        currentVersion: '0.4.0',
        lastChecked: new Date().toISOString(),
        error: err.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleApplyGitUpdate = async () => {
    setIsApplying(true);
    setApplyLog('Sincronizando cambios con git pull origin master...\n');
    setApplyError(null);

    try {
      const res = await updateService.applyGitUpdate();
      if (res.success) {
        setApplyLog((prev) => (prev || '') + res.output + '\n\n¡Actualización completada! Recargando aplicación...');
        setApplySuccess(true);
      } else {
        setApplyError(res.error || 'Error al aplicar actualización');
      }
    } catch (err: any) {
      setApplyError(err.message || 'Error inesperado al actualizar');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveToken = () => {
    if (onSaveGithubToken) {
      onSaveGithubToken(tokenInput.trim());
    }
    handleCheckUpdates();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      onClick={!isApplying ? onClose : undefined}
    >
      <div 
        className="relative w-full max-w-2xl flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Centro de Actualizaciones & GitHub
                </h3>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono font-bold">
                  v{updateResult?.currentVersion || '0.4.0'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Sincronización directa con el repositorio de SoyJhery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isApplying}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 select-text">
          
          {/* Status Box */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/60 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Repositorio Oficial:
                </span>
                <button
                  onClick={() => updateService.openGitHubRepo()}
                  className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  title="Abrir repositorio en GitHub"
                >
                  <span>SoyJhery/biblia-desktop</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                <span>Versión instalada: <strong className="text-stone-700 dark:text-stone-300 font-mono">v{updateResult?.currentVersion || '0.4.0'}</strong></span>
                {updateResult?.currentCommit && (
                  <span>Commit: <code className="px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-700 font-mono text-[11px]">{updateResult.currentCommit}</code></span>
                )}
              </div>
            </div>

            <button
              onClick={handleCheckUpdates}
              disabled={isChecking || isApplying}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-semibold text-xs transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Comprobando...' : 'Comprobar'}</span>
            </button>
          </div>

          {/* Results Display */}
          {isChecking ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Verificando commits y lanzamientos en GitHub...</p>
            </div>
          ) : updateResult?.hasUpdate ? (
            <div className="space-y-4 animate-slide-up">
              
              {/* Alert Banner: Update Available */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    ¡Nueva actualización disponible!
                  </h4>
                  <p className="text-xs text-amber-800/90 dark:text-amber-400/90 mt-0.5">
                    {updateResult.mode === 'git'
                      ? `Hay mejoras publicadas en la rama master de GitHub listas para sincronizar.`
                      : `Se ha publicado una nueva versión (${updateResult.latestVersion}) en GitHub.`}
                  </p>
                </div>
              </div>

              {/* Mode Git: Pending Commits List */}
              {updateResult.mode === 'git' && updateResult.pendingCommits && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Mejoras incluidas ({updateResult.pendingCommits.length}):
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 p-1">
                    {updateResult.pendingCommits.map((c) => (
                      <div key={c.hash} className="p-2.5 text-xs flex items-start gap-2.5">
                        <GitCommit className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 dark:text-stone-200 truncate">
                            {c.message}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400 font-mono">
                            <span>{c.hash}</span>
                            <span>•</span>
                            <span>{c.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 1-Click Update Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleApplyGitUpdate}
                      disabled={isApplying || applySuccess}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
                    >
                      <ArrowUpCircle className={`w-4 h-4 ${isApplying ? 'animate-spin' : ''}`} />
                      <span>{isApplying ? 'Sincronizando y reconstruyendo aplicación...' : 'Sincronizar y Actualizar Ahora (1 Clic)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Release: GitHub Release Notes & Downloads */}
              {updateResult.mode === 'release' && updateResult.releaseInfo && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {updateResult.releaseInfo.title}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {updateResult.releaseInfo.publishedAt.slice(0, 10)}
                      </span>
                    </div>

                    {updateResult.releaseInfo.notes && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 font-serif leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {updateResult.releaseInfo.notes}
                      </p>
                    )}
                  </div>

                  {/* Download Assets */}
                  {updateResult.releaseInfo.assets && updateResult.releaseInfo.assets.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        Archivos descargables:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {updateResult.releaseInfo.assets.map((asset, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateService.openExternalUrl(asset.downloadUrl)}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-500 bg-stone-50 dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 transition-all font-medium"
                          >
                            <span className="truncate">{asset.name}</span>
                            <Download className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => updateService.openExternalUrl(updateResult.releaseInfo!.url)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs transition-all shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ver Lanzamiento Oficial en GitHub</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Terminal Log */}
              {applyLog && (
                <div className="p-3.5 rounded-xl bg-stone-950 text-stone-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-stone-800">
                  <div className="flex items-center gap-1.5 text-amber-400 mb-2 pb-1 border-b border-stone-800">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Registro de actualización en tiempo real:</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{applyLog}</pre>
                </div>
              )}

              {applyError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  ¡Tu aplicación está completamente actualizada!
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                  Tienes instalada la última versión disponible (v{updateResult?.currentVersion || '0.4.0'}) con todas las mejoras canónicas, léxicas y de diseño.
                </p>
              </div>
            </div>
          )}

          {/* GitHub Token Accordion / Option for Private Repos */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => setShowTokenField(!showTokenField)}
              className="text-[11px] font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1 transition-colors"
            >
              <Key className="w-3 h-3" />
              <span>Opciones avanzadas: Token de acceso GitHub (para repositorios privados)</span>
            </button>

            {showTokenField && (
              <div className="mt-2.5 p-3 rounded-xl bg-stone-100/60 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Si tu repositorio en GitHub es privado y deseas descargar releases directamente mediante la API de GitHub, puedes ingresar un Personal Access Token (PAT) con permiso de solo lectura (`contents:read`):
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleSaveToken}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex items-center justify-between text-xs text-stone-500">
          <button
            onClick={() => updateService.openReleases()}
            className="flex items-center gap-1.5 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver historial de lanzamientos en GitHub</span>
          </button>

          <button
            onClick={onClose}
            disabled={isApplying}
            className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium transition-colors disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
