import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import https from 'https';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

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

function getAppIconPath(): string | undefined {
  const icoPath = path.join(__dirname, '../build/icon.ico');
  const pngPath = path.join(__dirname, '../build/icon.png');
  if (process.platform === 'win32' && fs.existsSync(icoPath)) {
    return icoPath;
  }
  if (fs.existsSync(pngPath)) {
    return pngPath;
  }
  return undefined;
}

function createWindow() {
  const icon = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon,
    backgroundColor: '#0c0a09', // stone-950 dark background for seamless launch
    title: 'Biblia RVR 1960 — Una app de SoyJhery',
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

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (!message.includes('Electron Security Warning')) {
      console.log(`[Renderer]: ${message} (${sourceId}:${line})`);
    }
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Render process gone:', details);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
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

// IPC: System & GitHub Updates
ipcMain.handle('get-app-version', async () => {
  return app.getVersion() || '0.4.0';
});

ipcMain.handle('open-external-url', async (_, url: string) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
  }
});

function runCommand(cmd: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, timeout: 35000 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      }
    });
  });
}

function fetchGitHubJson(url: string, token?: string): Promise<any> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      'User-Agent': 'Biblia-RVR-1960-SoyJhery',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const req = https.get(url, { headers, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

ipcMain.handle('check-for-updates', async (_, token?: string) => {
  const currentVersion = app.getVersion() || '0.4.0';
  const rootDir = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..');
  const projectDir = fs.existsSync(path.join(rootDir, '.git')) ? rootDir : process.cwd();
  const hasGit = fs.existsSync(path.join(projectDir, '.git'));

  // 1. Si tenemos entorno Git, comprobar directamente con origin/master
  if (hasGit) {
    try {
      const commitRes = await runCommand('git rev-parse --short HEAD', projectDir);
      const currentCommit = commitRes.stdout.trim();

      // Fetch remoto a master
      await runCommand('git fetch origin master', projectDir);

      // Conteo de commits pendientes
      const countRes = await runCommand('git rev-list HEAD..origin/master --count', projectDir);
      const pendingCount = parseInt(countRes.stdout.trim(), 10) || 0;

      if (pendingCount > 0) {
        const logRes = await runCommand('git log HEAD..origin/master --pretty=format:"%h%x09%s%x09%cd" --date=short -n 15', projectDir);
        const pendingCommits = logRes.stdout.trim().split('\n').filter(Boolean).map((line) => {
          const [hash, message, date] = line.split('\t');
          return { hash: hash || '', message: message || '', date: date || '' };
        });

        return {
          hasUpdate: true,
          mode: 'git',
          currentVersion,
          latestVersion: `${currentVersion} (+${pendingCount} mejoras)`,
          currentCommit,
          pendingCommits,
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          hasUpdate: false,
          mode: 'none',
          currentVersion,
          currentCommit,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (gitErr: any) {
      console.warn('Git update check warning:', gitErr.message);
    }
  }

  // 2. Comprobar GitHub Releases
  try {
    const releaseData = await fetchGitHubJson('https://api.github.com/repos/SoyJhery/biblia-desktop/releases/latest', token);
    if (releaseData && releaseData.tag_name) {
      const remoteTag = releaseData.tag_name.replace(/^v/, '');
      const isNewer = remoteTag !== currentVersion;
      if (isNewer) {
        return {
          hasUpdate: true,
          mode: 'release',
          currentVersion,
          latestVersion: releaseData.tag_name,
          releaseInfo: {
            tagName: releaseData.tag_name,
            title: releaseData.name || releaseData.tag_name,
            notes: releaseData.body || '',
            publishedAt: releaseData.published_at || '',
            url: releaseData.html_url || 'https://github.com/SoyJhery/biblia-desktop/releases',
            assets: (releaseData.assets || []).map((a: any) => ({
              name: a.name,
              downloadUrl: a.browser_download_url,
              size: a.size,
            })),
          },
          lastChecked: new Date().toISOString(),
        };
      }
    }
  } catch (apiErr: any) {
    console.warn('GitHub API check warning:', apiErr.message);
  }

  return {
    hasUpdate: false,
    mode: 'none',
    currentVersion,
    lastChecked: new Date().toISOString(),
  };
});

ipcMain.handle('apply-git-update', async () => {
  const rootDir = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..');
  const projectDir = fs.existsSync(path.join(rootDir, '.git')) ? rootDir : process.cwd();

  try {
    const pullRes = await runCommand('git pull origin master', projectDir);
    let output = pullRes.stdout;

    // Si hay cambios en el código web, recompilar Vite rápidamente
    try {
      const buildRes = await runCommand('npm run build:vite', projectDir);
      output += '\n' + buildRes.stdout;
    } catch (bErr: any) {
      output += '\nRebuild note: ' + bErr.message;
    }

    // Recargar ventana de la aplicación
    if (mainWindow) {
      setTimeout(() => {
        mainWindow?.webContents.reload();
      }, 500);
    }

    return { success: true, output };
  } catch (err: any) {
    return { success: false, output: '', error: err.message };
  }
});

