import { contextBridge, ipcRenderer } from 'electron';
import { MainEvent, RendererEvent } from './interfaces/events.enum';

const api = {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  restart: () => ipcRenderer.send(RendererEvent.AppRestart),

  toMainLoad: () => ipcRenderer.invoke(RendererEvent.Initialize),

  toMainChoose: (chatStorage: string, path: string) =>
    ipcRenderer.invoke(RendererEvent.Choose, chatStorage, path),

  toMainPickupDialog: () => ipcRenderer.invoke(RendererEvent.PickupDialog),
};

contextBridge.exposeInMainWorld('ipc', api);
