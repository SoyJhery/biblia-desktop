import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  saveUserData: (data: unknown) => ipcRenderer.invoke('save-user-data', data),
  exportBackup: (data: unknown) => ipcRenderer.invoke('export-backup', data),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  isElectron: true,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
