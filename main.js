const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve').default || require('electron-serve');
const path = require('path');

const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, 'out')
}) : serve({
  directory: path.join(__dirname, 'out')
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove menu bar for a cleaner app feel
  win.setMenuBarVisibility(false);

  appServe(win).then(() => {
    win.loadURL('app://-');
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
