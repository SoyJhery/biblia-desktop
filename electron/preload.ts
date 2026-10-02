import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  saveUserData: (data: unknown) => ipcRenderer.invoke('save-user-data', data),
  exportBackup: (data: unknown) => ipcRenderer.invoke('export-backup', data),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  checkForUpdates: (token?: string) => ipcRenderer.invoke('check-for-updates', token),
  applyGitUpdate: () => ipcRenderer.invoke('apply-git-update'),
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isElectron: true,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
