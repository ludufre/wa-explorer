import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { DataService, ElectronService, IconService } from './engine/services';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  appPages = [];
  labels = [];

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private icon: IconService,
    public data: DataService,
    public damSan: DomSanitizer
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);

      this.electronService.ipcRenderer.on('load2', () => {
        console.log('pong');
      });

      this.electronService.ipcRenderer.send('load1');

    } else {
      console.log('Run in browser');
    }
  }
}
