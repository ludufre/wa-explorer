/* eslint-disable @typescript-eslint/no-var-requires */
import log from 'electron-log';
import { app, BrowserWindow, protocol, net } from 'electron';
import * as path from 'path';
import { initializeIpcHandlers } from './listenners';

log.initialize();

console.warn = log.warn;
console.error = log.error;
console.log = log.log;
console.info = console.log;
console.debug = log.debug;

console.log('🍏🍏🍏 Here where it all begins');

let win!: BrowserWindow | null;

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

if (serve) {
  console.log('🍏 Starting in development mode');
} else {
  console.log('🍏 Starting in production mode');
  app.commandLine.appendSwitch('use-gl', 'egl-angle');
  app.commandLine.appendSwitch('angle-platform', 'default');
}

async function createWindow(): Promise<BrowserWindow> {
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    useContentSize: true,

    // macOS native window configuration
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 16 },
    transparent: true,
    vibrancy: 'sidebar',

    show: false,
    backgroundColor: '#00000000',
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (serve) {
    // const debug = await import('electron-debug');
    // debug.default();

    win.loadURL('http://localhost:4200');
  } else {
    const url = new URL(path.join('file:', __dirname, '../index.html'));
    win.loadURL(url.href);
  }

  win.on('close', async () => {});

  win.on('closed', () => {
    win = null;
  });

  initializeIpcHandlers(win.webContents);

  if (serve) {
    win?.webContents.openDevTools();
  }

  win!.webContents.on('did-finish-load', () => {
    console.log('🍏🍏🍏 did-finish-load');
  });

  win?.show();

  return win;
}

// Send console from renderer to main

try {
  // Register privileges for custom protocol before app is ready
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'local-file',
      privileges: {
        bypassCSP: true,
        supportFetchAPI: true,
        standard: true,
        secure: true,
        corsEnabled: true,
      },
    },
  ]);

  app.whenReady().then(() => {
    // Register custom protocol for loading local files
    protocol.handle('local-file', request => {
      let filePath = decodeURIComponent(
        request.url.replace('local-file://', ''),
      );
      // Ensure path starts with / on Unix systems
      if (process.platform !== 'win32' && !filePath.startsWith('/')) {
        filePath = '/' + filePath;
      }
      return net.fetch('file://' + filePath);
    });
  });

  app.on('ready', async () => {
    await createWindow();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
