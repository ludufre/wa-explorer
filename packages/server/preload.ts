import { contextBridge, ipcRenderer } from 'electron';

const api = {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,

  sendChild: (data: any) => ipcRenderer.invoke('child:message', data),

  getConfig: () => ipcRenderer.invoke('config:get'),

  onChildMessage: (callback: any) =>
    ipcRenderer.on('child:message', (_event, value) => callback(value)),

  started: () => ipcRenderer.invoke('started'),

  childsList: () => ipcRenderer.invoke('childs:list'),

  choosed: (callback: any) =>
    ipcRenderer.on('choosed', (_event, value) => callback(value)),

  load: () => ipcRenderer.invoke('loadd'),

  choose: (chatStorage: string, path: string) =>
    ipcRenderer.send('choose', chatStorage, path),

  pickupDialog: () => ipcRenderer.invoke('pickup-dialog'),
};

contextBridge.exposeInMainWorld('appApi', api);
