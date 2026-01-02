export interface IElectronAPI {
  node: () => string;
  chrome: () => string;
  electron: () => string;
  restart: () => void;

  toMainLoad: () => Promise<{ ok: boolean }>;

  toMainChoose: (
    chatStorage: string,
    path: string,
  ) => Promise<{
    ok: number;
    data: {
      id: string;
      contact: string;
      name: string;
      last: Date;
      picture: string;
    }[];
  }>;

  toMainPickupDialog: () => Promise<{
    ok: number;
    msg?: string;
    db?: string;
    path?: string;
  }>;
}

declare global {
  interface Window {
    ipc: IElectronAPI;
  }
}
