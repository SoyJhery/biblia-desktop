export interface ElectronAPI {
  getUserData: () => Promise<any>;
  saveUserData: (data: unknown) => Promise<{ success: boolean; error?: string }>;
  exportBackup: (data: unknown) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  importBackup: () => Promise<{ success: boolean; data?: any; canceled?: boolean; error?: string }>;
  checkForUpdates: (token?: string) => Promise<any>;
  applyGitUpdate: () => Promise<{ success: boolean; output: string; error?: string }>;
  openExternalUrl: (url: string) => Promise<void>;
  getAppVersion: () => Promise<string>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

