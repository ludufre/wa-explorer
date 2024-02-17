import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_CONFIG } from '../environments/environment';
import {
  IonApp,
  IonRouterOutlet,
  IonItem,
  IonAvatar,
  IonMenuToggle,
  IonList,
  IonContent,
  IonMenu,
  IonSplitPane,
  IonLabel,
} from '@ionic/angular/standalone';
import { DataService, IconService, ElectronService } from './engine/services';
import { SharedModule } from './engine/components/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet,
    IonItem,
    IonAvatar,
    IonMenuToggle,
    IonList,
    IonContent,
    IonMenu,
    IonSplitPane,
    IonLabel,
    RouterLink,
    SharedModule,
  ],
})
export class AppComponent {
  electronService = inject(ElectronService);
  iconService = inject(IconService);
  data = inject(DataService);

  constructor() {
    console.log('APP_CONFIG', APP_CONFIG, this.electronService.isElectron);

    window?.appApi?.started().then(() => {
      console.log('Started');
    });

    if (this.electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }
}
