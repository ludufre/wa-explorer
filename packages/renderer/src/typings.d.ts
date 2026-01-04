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

  toMainGetMessages: (
    chatStorage: string,
    path: string,
    contactJid: string,
  ) => Promise<{
    ok: number;
    msg?: string;
    data?: {
      id: number;
      from: string;
      to: string;
      text: string;
      date: number;
      isFromMe: boolean;
      type: number;
      groupMember?: string;
      mediaItemId?: number | null;
    }[];
    session?: {
      contact: string;
      name: string;
    };
  }>;

  toMainGetMessagesPaginated: (
    chatStorage: string,
    path: string,
    contactJid: string,
    limit: number,
    offset: number,
  ) => Promise<{
    ok: number;
    msg?: string;
    data?: {
      messages: {
        id: number;
        from: string;
        to: string;
        text: string;
        date: number;
        isFromMe: boolean;
        type: number;
        groupMember?: string;
        mediaItemId?: number | null;
      }[];
      total: number;
      hasMore: boolean;
      offset: number;
    };
    session?: {
      contact: string;
      name: string;
    };
  }>;

  toMainGetMediaPath: (
    chatStorage: string,
    path: string,
    mediaItemId: number,
  ) => Promise<{
    ok: number;
    path: string | null;
  }>;

  toMainCloseBackup: (
    chatStorage: string,
    path: string,
  ) => Promise<{
    ok: number;
  }>;
}

declare global {
  interface Window {
    ipc: IElectronAPI;
  }
}
