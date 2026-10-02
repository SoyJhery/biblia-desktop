import { ProjectorDisplay, ProjectorSlide, ProjectorTheme, ProjectorMode } from '../types';

declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      getUserData?: () => Promise<any>;
      saveUserData?: (data: any) => Promise<any>;
      exportBackup?: (data: any) => Promise<any>;
      importBackup?: () => Promise<any>;
      getDisplays?: () => Promise<ProjectorDisplay[]>;
      openProjector?: (displayId?: number) => Promise<{ success: boolean; isNew?: boolean; displayId?: number }>;
      closeProjector?: () => Promise<{ success: boolean }>;
      getProjectorStatus?: () => Promise<{ isOpen: boolean }>;
      sendProjectorSlide?: (slide: unknown) => Promise<{ success: boolean; delivered: boolean }>;
      onProjectorSlideUpdate?: (callback: (slide: any) => void) => () => void;
      onProjectorStatusChanged?: (callback: (status: { isOpen: boolean; displayId?: number }) => void) => () => void;
      getNetworkInfo?: () => Promise<{ ip: string; port: number; url: string; connectedClients: number }>;
    };
  }
}

const BROADCAST_CHANNEL_NAME = 'biblia_rvr1960_projector';
const STORAGE_SLIDE_KEY = 'biblia_projector_current_slide';
const STORAGE_STATUS_KEY = 'biblia_projector_status';

class ProjectorService {
  private channel: BroadcastChannel | null = null;
  private currentSlide: ProjectorSlide;
  private isProjectorOpen = false;

  constructor() {
    this.currentSlide = {
      type: 'verse',
      title: 'Biblia Reina-Valera 1960',
      subtitle: 'Una app de SoyJhery',
      text: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.',
      reference: 'Salmos 119:105',
      theme: 'obsidian',
      mode: 'full',
      fontSizeMultiplier: 1.0,
      blackout: false,
      logo: true,
      timestamp: Date.now(),
    };

    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      } catch (e) {
        console.warn('BroadcastChannel no soportado, usando fallback localStorage:', e);
      }
    }
  }

  public getCurrentSlide(): ProjectorSlide {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_SLIDE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return this.currentSlide;
  }

  public async getDisplays(): Promise<ProjectorDisplay[]> {
    if (window.electronAPI?.getDisplays) {
      try {
        const displays = await window.electronAPI.getDisplays();
        if (displays && displays.length > 0) return displays;
      } catch (err) {
        console.error('Error al obtener pantallas de Electron:', err);
      }
    }

    // Fallback para navegador o monomonitor
    return [
      {
        id: 1,
        label: 'Pantalla Principal (Ventana / Proyector Web)',
        bounds: {
          x: 0,
          y: 0,
          width: typeof window !== 'undefined' ? window.screen.width : 1920,
          height: typeof window !== 'undefined' ? window.screen.height : 1080,
        },
        isPrimary: true,
      },
    ];
  }

  public async openProjector(displayId?: number): Promise<{ success: boolean; displayId?: number }> {
    this.isProjectorOpen = true;

    if (window.electronAPI?.openProjector) {
      try {
        const res = await window.electronAPI.openProjector(displayId);
        // Enviar slide actual inmediatamente al abrir
        await this.sendSlide(this.getCurrentSlide());
        return { success: res.success, displayId: res.displayId };
      } catch (err) {
        console.error('Error al abrir proyector en Electron:', err);
      }
    }

    // Modo navegador: Abrir ventana emergente dedicada a pantalla completa
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?mode=projector#projector`;
      const popWindow = window.open(
        url,
        'BibliaProjectorWindow',
        'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
      );
      if (popWindow) {
        popWindow.focus();
      }
      localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify({ isOpen: true }));
      this.channel?.postMessage({ type: 'STATUS_CHANGE', isOpen: true });
    }

    return { success: true };
  }

  public async closeProjector(): Promise<{ success: boolean }> {
    this.isProjectorOpen = false;

    if (window.electronAPI?.closeProjector) {
      try {
        await window.electronAPI.closeProjector();
        return { success: true };
      } catch (err) {
        console.error('Error al cerrar proyector en Electron:', err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify({ isOpen: false }));
      this.channel?.postMessage({ type: 'STATUS_CHANGE', isOpen: false });
    }

    return { success: true };
  }

  public async getStatus(): Promise<{ isOpen: boolean }> {
    if (window.electronAPI?.getProjectorStatus) {
      try {
        const res = await window.electronAPI.getProjectorStatus();
        this.isProjectorOpen = res.isOpen;
        return res;
      } catch {}
    }
    return { isOpen: this.isProjectorOpen };
  }

  public async sendSlide(slide: ProjectorSlide): Promise<void> {
    this.currentSlide = slide;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SLIDE_KEY, JSON.stringify(slide));
    }

    // Enviar por BroadcastChannel (para ventanas de navegador o dev)
    if (this.channel) {
      this.channel.postMessage({ type: 'SLIDE_UPDATE', slide });
    }

    // Enviar por IPC a la ventana de Electron
    if (window.electronAPI?.sendProjectorSlide) {
      try {
        await window.electronAPI.sendProjectorSlide(slide);
      } catch (e) {
        console.error('Error al enviar slide por IPC:', e);
      }
    }

    // Si estamos en un navegador remoto o móvil, enviar vía POST /api/slide
    if (typeof window !== 'undefined' && !window.electronAPI?.isElectron) {
      fetch('/api/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slide),
      }).catch(() => {});
    }
  }

  public async getNetworkInfo(): Promise<{ ip: string; port: number; url: string; connectedClients: number }> {
    if (window.electronAPI?.getNetworkInfo) {
      try {
        return await window.electronAPI.getNetworkInfo();
      } catch (e) {
        console.error('Error al obtener network info de Electron:', e);
      }
    }

    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    const port = typeof window !== 'undefined' && window.location.port ? Number(window.location.port) : 5173;
    return {
      ip: host,
      port,
      url: `http://${host}:${port}/?mode=projector`,
      connectedClients: 0,
    };
  }

  public onSlideUpdate(callback: (slide: ProjectorSlide) => void): () => void {
    let unsubscribeElectron: (() => void) | undefined;

    // 1. Escuchar por IPC de Electron
    if (window.electronAPI?.onProjectorSlideUpdate) {
      unsubscribeElectron = window.electronAPI.onProjectorSlideUpdate(callback);
    }

    // 2. Escuchar por BroadcastChannel
    const channelHandler = (event: MessageEvent) => {
      if (event.data?.type === 'SLIDE_UPDATE' && event.data.slide) {
        callback(event.data.slide);
      }
    };
    if (this.channel) {
      this.channel.addEventListener('message', channelHandler);
    }

    // 3. Escuchar por evento de storage
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_SLIDE_KEY && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', storageHandler);
    }

    // 4. Escuchar por Server-Sent Events (SSE) en red local (teléfonos Android, tablets, smart TVs)
    let sse: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        sse = new EventSource('/api/events');
        sse.onmessage = (event) => {
          try {
            const remoteSlide = JSON.parse(event.data);
            if (remoteSlide && remoteSlide.title) {
              this.currentSlide = remoteSlide;
              callback(remoteSlide);
            }
          } catch {}
        };
      } catch (err) {
        console.warn('SSE no disponible:', err);
      }
    }

    return () => {
      if (unsubscribeElectron) unsubscribeElectron();
      if (this.channel) {
        this.channel.removeEventListener('message', channelHandler);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', storageHandler);
      }
      if (sse) {
        sse.close();
      }
    };
  }

  public onStatusChange(callback: (status: { isOpen: boolean }) => void): () => void {
    let unsubscribeElectron: (() => void) | undefined;

    if (window.electronAPI?.onProjectorStatusChanged) {
      unsubscribeElectron = window.electronAPI.onProjectorStatusChanged((st) => {
        this.isProjectorOpen = st.isOpen;
        callback({ isOpen: st.isOpen });
      });
    }

    const channelHandler = (event: MessageEvent) => {
      if (event.data?.type === 'STATUS_CHANGE') {
        this.isProjectorOpen = !!event.data.isOpen;
        callback({ isOpen: this.isProjectorOpen });
      }
    };
    if (this.channel) {
      this.channel.addEventListener('message', channelHandler);
    }

    return () => {
      if (unsubscribeElectron) unsubscribeElectron();
      if (this.channel) {
        this.channel.removeEventListener('message', channelHandler);
      }
    };
  }

  // Creadores de diapositivas rápidas
  public createVerseSlide(
    bookName: string,
    chapter: number,
    verseStart: number,
    verseEnd: number | undefined,
    text: string,
    currentTheme: ProjectorTheme = 'obsidian',
    currentMode: ProjectorMode = 'full',
    fontSizeMultiplier = 1.0
  ): ProjectorSlide {
    const isRange = verseEnd !== undefined && verseEnd > verseStart;
    const ref = `${bookName} ${chapter}:${verseStart}${isRange ? `-${verseEnd}` : ''}`;

    return {
      type: 'verse',
      title: ref,
      subtitle: 'Reina-Valera 1960',
      text,
      reference: ref,
      theme: currentTheme,
      mode: currentMode,
      fontSizeMultiplier,
      blackout: false,
      logo: false,
      timestamp: Date.now(),
    };
  }

  public createOutlineSlide(
    title: string,
    content: string,
    subtitle?: string,
    currentTheme: ProjectorTheme = 'obsidian',
    currentMode: ProjectorMode = 'full',
    fontSizeMultiplier = 1.0
  ): ProjectorSlide {
    return {
      type: 'outline',
      title,
      subtitle: subtitle || 'Punto Homilético de Predicación',
      text: content,
      theme: currentTheme,
      mode: currentMode,
      fontSizeMultiplier,
      blackout: false,
      logo: false,
      timestamp: Date.now(),
    };
  }
}

export const projectorService = new ProjectorService();
