const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');

// Development mode check
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: true,
    backgroundColor: '#f8fafc'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Create application menu
  const menuTemplate = [
    {
      label: 'AICO ERP',
      submenu: [
        { label: 'Hakkında', click: () => showAbout() },
        { type: 'separator' },
        { label: 'Ayarlar', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navigate', '/settings') },
        { type: 'separator' },
        { label: 'Çıkış', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { label: 'Geri Al', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Yinele', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Tümünü Seç', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yenile', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Geliştirici Araçları', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Tam Ekran', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Yakınlaştır', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Uzaklaştır', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Varsayılan Boyut', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
      ]
    },
    {
      label: 'Modüller',
      submenu: [
        { label: 'Anasayfa', accelerator: 'CmdOrCtrl+1', click: () => mainWindow.webContents.send('navigate', '/') },
        { label: 'Siparişler', accelerator: 'CmdOrCtrl+2', click: () => mainWindow.webContents.send('navigate', '/orders') },
        { label: 'Ürünler', accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.send('navigate', '/products') },
        { label: 'Müşteriler', accelerator: 'CmdOrCtrl+4', click: () => mainWindow.webContents.send('navigate', '/customers') },
        { label: 'Ödemeler', accelerator: 'CmdOrCtrl+5', click: () => mainWindow.webContents.send('navigate', '/payments') },
        { type: 'separator' },
        { label: 'Yeni Sipariş', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('navigate', '/orders/new') }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        { label: 'Kullanım Kılavuzu', click: () => mainWindow.webContents.send('navigate', '/help') },
        { label: 'Destek', click: () => require('electron').shell.openExternal('mailto:support@aico.com') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'AICO ERP Hakkında',
    message: 'AICO ERP v1.0.0',
    detail: 'Profesyonel Turizm & Halı Ticareti Yönetim Sistemi\n\n© 2024 AICO Bilişim\nTüm hakları saklıdır.'
  });
}

// IPC Handlers
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
  });
  return result.filePaths[0];
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
    defaultPath: options?.defaultPath
  });
  return result.filePath;
});

ipcMain.handle('show-confirm', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['İptal', 'Tamam'],
    defaultId: 1,
    title: options.title || 'Onay',
    message: options.message
  });
  return result.response === 1;
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
