import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// En Linux, deshabilitar aceleración por hardware para evitar fallos de controladores gráficos iHD/VA-API
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

const isDev = process.env.NODE_ENV === 'development';

function getUserDataFilePath(): string {
  const userDir = app.getPath('userData');
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return path.join(userDir, 'biblia_userdata.json');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0c0a09', // stone-950 dark background for seamless launch
    title: 'Biblia RVR 1960',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const distHtmlPath = path.join(__dirname, '../dist/index.html');

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173').catch(() => {
      console.log('Servidor Vite no disponible, cargando paquete dist/index.html...');
      mainWindow?.loadFile(distHtmlPath);
    });
  } else {
    mainWindow.loadFile(distHtmlPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: User Data Persistence
ipcMain.handle('get-user-data', async () => {
  try {
    const filePath = getUserDataFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
});

ipcMain.handle('save-user-data', async (_, data: unknown) => {
  try {
    const filePath = getUserDataFilePath();
    // Atomic write via temp file
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving user data:', error);
    return { success: false, error: error.message };
  }
});

// IPC: Export & Import Backups
ipcMain.handle('export-backup', async (_, data: unknown) => {
  if (!mainWindow) return { success: false, error: 'No window' };
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Respaldo de Estudio Bíblico',
      defaultPath: `respaldo_biblia_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('import-backup', async () => {
  if (!mainWindow) return { success: false, error: 'No window' };
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Importar Respaldo de Estudio Bíblico',
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) return { success: false, canceled: true };

    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});
