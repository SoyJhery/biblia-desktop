import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import os from 'os';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow: BrowserWindow | null = null;
let projectorWindow: BrowserWindow | null = null;

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
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      projectorWindow.close();
      projectorWindow = null;
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  startLocalProjectorServer();

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

// ==========================================
// Fase 4: Modo Proyector & Segunda Pantalla
// ==========================================

function getProjectorTargetDisplay(targetDisplayId?: number) {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();

  if (targetDisplayId !== undefined) {
    const found = displays.find((d) => d.id === targetDisplayId);
    if (found) return found;
  }

  // Si existe una pantalla secundaria (proyector/TV), usarla por defecto
  const secondary = displays.find((d) => d.id !== primary.id);
  return secondary || primary;
}

function openProjectorWindow(targetDisplayId?: number) {
  const targetDisplay = getProjectorTargetDisplay(targetDisplayId);
  const distHtmlPath = path.join(__dirname, '../dist/index.html');

  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.setBounds(targetDisplay.bounds);
    projectorWindow.setFullScreen(true);
    projectorWindow.show();
    projectorWindow.focus();
    mainWindow?.webContents.send('projector-status-changed', { isOpen: true, displayId: targetDisplay.id });
    return { success: true, isNew: false, displayId: targetDisplay.id };
  }

  projectorWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: true,
    frame: false,
    backgroundColor: '#000000',
    title: 'Biblia RVR 1960 — Modo Proyector',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  projectorWindow.once('ready-to-show', () => {
    projectorWindow?.show();
    projectorWindow?.focus();
    mainWindow?.webContents.send('projector-status-changed', { isOpen: true, displayId: targetDisplay.id });
  });

  if (isDev) {
    projectorWindow.loadURL('http://127.0.0.1:5173?mode=projector').catch(() => {
      projectorWindow?.loadFile(distHtmlPath, { query: { mode: 'projector' } });
    });
  } else {
    projectorWindow.loadFile(distHtmlPath, { query: { mode: 'projector' } });
  }

  projectorWindow.on('closed', () => {
    projectorWindow = null;
    mainWindow?.webContents.send('projector-status-changed', { isOpen: false });
  });

  return { success: true, isNew: true, displayId: targetDisplay.id };
}

ipcMain.handle('get-displays', async () => {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  return displays.map((d, idx) => {
    const isPrimary = d.id === primary.id;
    let label = d.label;
    if (!label) {
      label = isPrimary
        ? `Pantalla ${idx + 1} (${d.bounds.width}x${d.bounds.height}) [Principal]`
        : `Pantalla ${idx + 1} (${d.bounds.width}x${d.bounds.height}) [HDMI / Proyector]`;
    }
    return {
      id: d.id,
      label,
      bounds: d.bounds,
      isPrimary,
    };
  });
});

ipcMain.handle('open-projector', async (_, displayId?: number) => {
  return openProjectorWindow(displayId);
});

ipcMain.handle('close-projector', async () => {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;
  }
  mainWindow?.webContents.send('projector-status-changed', { isOpen: false });
  return { success: true };
});

ipcMain.handle('get-projector-status', async () => {
  const isOpen = !!projectorWindow && !projectorWindow.isDestroyed();
  return { isOpen };
});

ipcMain.handle('send-projector-slide', async (_, slide: unknown) => {
  broadcastSlideToNetwork(slide);
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.webContents.send('projector-slide-update', slide);
    return { success: true, delivered: true };
  }
  return { success: true, delivered: false };
});

// ========================================================
// Sincronización Inalámbrica por Red Local (Móviles / TVs)
// ========================================================

let currentProjectorSlide: any = {
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

let sseClients: http.ServerResponse[] = [];

function getLocalNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function broadcastSlideToNetwork(slide: unknown) {
  currentProjectorSlide = slide;
  const payload = `data: ${JSON.stringify(slide)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

function startLocalProjectorServer() {
  const server = http.createServer((req, res) => {
    // Permitir CORS para cualquier cliente en la red Wi-Fi
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const reqUrl = req.url || '/';
    const parsedUrl = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);

    // Stream SSE en tiempo real
    if (parsedUrl.pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(`data: ${JSON.stringify(currentProjectorSlide)}\n\n`);
      sseClients.push(res);

      req.on('close', () => {
        sseClients = sseClients.filter((c) => c !== res);
      });
      return;
    }

    // Endpoint REST para consultar o enviar diapositiva
    if (parsedUrl.pathname === '/api/slide') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const slide = JSON.parse(body);
            broadcastSlideToNetwork(slide);
            if (projectorWindow && !projectorWindow.isDestroyed()) {
              projectorWindow.webContents.send('projector-slide-update', slide);
            }
            mainWindow?.webContents.send('projector-slide-update', slide);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch {
            res.writeHead(400);
            res.end();
          }
        });
        return;
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(currentProjectorSlide));
        return;
      }
    }

    // Servir archivos estáticos de dist/ para producción (puerto 5175)
    const distPath = path.join(__dirname, '../dist');
    let filePath = path.join(distPath, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(5175, '0.0.0.0', () => {
    console.log(`[Projector Sync Server] Escuchando en http://0.0.0.0:5175`);
  });

  server.on('error', (err) => {
    console.warn('[Projector Sync Server] Error:', err);
  });
}

ipcMain.handle('get-network-info', async () => {
  const ip = getLocalNetworkIp();
  const port = isDev ? 5173 : 5175;
  return {
    ip,
    port,
    url: `http://${ip}:${port}/?mode=projector`,
    connectedClients: sseClients.length,
  };
});

