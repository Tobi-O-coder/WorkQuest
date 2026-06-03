const electron = require('electron');
const { app, BrowserWindow, shell, Menu } = electron;
const path = require('path');

const isMac = process.platform === 'darwin';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    show: false, // show after content loads to avoid white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Native title bar on all platforms — clean and simple
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    // Extra top padding so macOS traffic lights don't overlap the nav bar
    trafficLightPosition: isMac ? { x: 16, y: 16 } : undefined,
  });

  win.loadFile(path.join(__dirname, '..', 'WorkQuest.html'));

  // Inject platform class so CSS can adapt (e.g. macOS traffic-light offset)
  win.webContents.on('dom-ready', () => {
    if (isMac) win.webContents.executeJavaScript("document.body.classList.add('electron-mac')");
    win.webContents.executeJavaScript("document.body.classList.add('electron')");
  });

  // Show only when fully rendered (no white flash)
  win.once('ready-to-show', () => win.show());

  // Open all external links in the system browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return; // allow local navigation
    event.preventDefault();
    shell.openExternal(url);
  });

  return win;
}

// ── App menu ──────────────────────────────────────────────────
function buildMenu() {
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
