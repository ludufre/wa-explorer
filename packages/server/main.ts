/* eslint-disable @typescript-eslint/no-var-requires */
import log from 'electron-log';
import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';
import * as path from 'path';
import { applyPrismaMigrations } from './utils/prisma';
import { getConfig, setConfig } from './utils/config';
import LoadController from './controllers/load.controller';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

if (!serve) {
  app.commandLine.appendSwitch('use-gl', 'desktop');
}

async function createWindow(): Promise<BrowserWindow> {
  log.initialize();
  console.warn = log.warn;
  console.error = log.error;
  console.log = log.log;
  console.info = log.info;
  console.debug = log.debug;

  await applyPrismaMigrations();

  const config = await getConfig();

  log.warn({ config });

  win = new BrowserWindow({
    ...(config?.window || {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    }),

    useContentSize: true,
    kiosk: false,
    fullscreen: false,
    show: false,
    alwaysOnTop: false,

    backgroundColor: '#151419',
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);

    win.loadURL('http://localhost:4200');
  } else {
    const url = new URL(path.join('file:', __dirname, '../index.html'));
    win.loadURL(url.href);
  }

  win.on('close', async () => {
    await setConfig('window', win?.getBounds());
  });

  win.on('closed', () => {
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    setTimeout(createWindow, 400);

    log.warn('Started');

    // protocol.handle('file', request => {
    //   console.log(request);
    //   // const pathname = decodeURI(request.url.replace('file:///', ''));
    //   return net.fetch(request.url);
    // });

    protocol.handle('atom', request =>
      net.fetch('file://' + request.url.slice('atom://'.length)),
    );

    try {
      ipcMain.handle('started', () => {
        win?.show();

        if (serve) {
          win?.webContents.openDevTools();
        }

        new LoadController();

        // register(win!).then(() => {
        //   console.warn('All childs starteds');
        // });

        // try {
        //   ipcMain.removeHandler('childs:list');
        // } catch (err) {
        //   console.log('ignored', err);
        // }
        // ipcMain.handle('childs:list', () => {
        //   return childs.map(o => ({
        //     name: o.name,
        //     slug: o.slug,
        //   }));
        // });

        // try {
        //   ipcMain.removeHandler('config:get');
        // } catch (err) {
        //   console.log('ignored', err);
        // }
        // ipcMain.handle('config:get', async () => {
        //   return await getConfig();
        // });
      });
    } catch (err) {
      console.log('ignored', err);
    }
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
