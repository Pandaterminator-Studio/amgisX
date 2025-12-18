const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

ipcMain.on('amgis:quit', () => {
  app.quit();
});

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  if (!fs.existsSync(preloadPath)) {
    console.error('Preload script not found at:', preloadPath);
  }

  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.on('preload-error', (_event, preload, error) => {
    console.error('Preload error:', preload, error);
  });

  win.webContents.on('did-finish-load', async () => {
    try {
      const hasAmgis = await win.webContents.executeJavaScript(
        "typeof window.amgis !== 'undefined' && typeof window.amgis.loadInitialData === 'function'"
      );
      if (process.env.AMGIS_DEBUG === '1') {
        console.log('Renderer sees window.amgis.loadInitialData:', hasAmgis);
      }
    } catch (error) {
      console.error('Failed to probe renderer state:', error);
    }
  });

  if (process.env.AMGIS_DEVTOOLS === '1') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  
  app.quit();
  
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
