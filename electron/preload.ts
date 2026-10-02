import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  saveUserData: (data: unknown) => ipcRenderer.invoke('save-user-data', data),
  exportBackup: (data: unknown) => ipcRenderer.invoke('export-backup', data),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  openProjector: (displayId?: number) => ipcRenderer.invoke('open-projector', displayId),
  closeProjector: () => ipcRenderer.invoke('close-projector'),
  getProjectorStatus: () => ipcRenderer.invoke('get-projector-status'),
  sendProjectorSlide: (slide: unknown) => ipcRenderer.invoke('send-projector-slide', slide),
  onProjectorSlideUpdate: (callback: (slide: any) => void) => {
    const handler = (_event: unknown, data: any) => callback(data);
    ipcRenderer.on('projector-slide-update', handler);
    return () => ipcRenderer.removeListener('projector-slide-update', handler);
  },
  onProjectorStatusChanged: (callback: (status: { isOpen: boolean; displayId?: number }) => void) => {
    const handler = (_event: unknown, data: any) => callback(data);
    ipcRenderer.on('projector-status-changed', handler);
    return () => ipcRenderer.removeListener('projector-status-changed', handler);
  },
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  isElectron: true,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
