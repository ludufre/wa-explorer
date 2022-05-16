import { BrowserWindow } from "electron";
import LoadController from "./controllers/load.controller";

export class Backend {
  listen() {
    new LoadController()
  }
}
