import { MessageChannelMain, WebContents, ipcMain, app } from 'electron';
import { MainEvent, RendererEvent } from './interfaces/events.enum';
import LoadController from './controllers/load.controller';

export function initializeIpcHandlers(webContents: WebContents) {
  const load = new LoadController();

  for (const handler of [
    RendererEvent.Initialize,
    RendererEvent.AppRestart,
    RendererEvent.Choose,
  ]) {
    try {
      ipcMain.removeHandler(handler);
    } catch (_) {
      // ignore
    }
  }

  ipcMain.handle(RendererEvent.Initialize, async () => {
    console.log('🍏 Initialize');
    return load.load();
  });

  ipcMain.handle(
    RendererEvent.Choose,
    async (_event, dbFile: string, base: string) => {
      console.log('🍏 Choose', dbFile, base);
      return load.choose(dbFile, base);
    },
  );

  ipcMain.handle(RendererEvent.PickupDialog, async event => {
    console.log('🍏 Pickup Dialog');
    return load.pickup(event);
  });
}
