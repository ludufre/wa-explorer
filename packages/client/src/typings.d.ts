import { Config } from '../../server/utils/config';

export interface IElectronAPI {
  node: () => string;
  chrome: () => string;
  electron: () => string;

  sendChild: (data: any) => Promise<any>;

  getConfig: () => Promise<Config>;

  onChildMessage: (
    callback: (child: string, type: string, data: any) => void,
  ) => void;

  started: () => Promise<void>;

  childsList: () => Promise<{ name: string; slug: string }[]>;

  choosed: (callback: (ret: any) => void) => void;

  load: () => Promise<any>;

  choose: (a: any, b: any) => Promise<void>;

  pickupDialog: () => Promise<any>;
}

declare global {
  interface Window {
    appApi: IElectronAPI;
  }
}
