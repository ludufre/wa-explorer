import { Component, inject, OnInit } from '@angular/core';
import { APP_CONFIG } from '../environments/environment';
import { ElectronService, IconService } from './engine/services';
import { DomSanitizer } from '@angular/platform-browser';
import { DateFnsConfigurationService } from 'ngx-date-fns';

import {
  IonApp,
  IonRouterOutlet,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

import { TranslateService } from '@ngx-translate/core';
import { ptBR } from 'date-fns/locale';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [IonApp, IonRouterOutlet, IonSelect, IonSelectOption],
})
export class AppComponent implements OnInit {
  electronService = inject(ElectronService);
  translate = inject(TranslateService);
  icon = inject(IconService);
  damSan = inject(DomSanitizer);
  dateFnsConfig = inject(DateFnsConfigurationService);

  appPages = [];
  labels = [];

  availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt-br', name: 'Português (Brasil)', flag: '🇧🇷' },
  ];

  get currentLanguage() {
    return this.translate.currentLang || 'en';
  }

  changeLanguage(lang: string) {
    console.log('Changing language to:', lang);
    this.translate.use(lang);
    if (lang === 'pt-br') {
      this.dateFnsConfig.setLocale(ptBR);
    } else {
      this.dateFnsConfig.setLocale(undefined); // Default locale (English)
    }
    localStorage.setItem('user-language', lang);
  }

  getSystemLanguage(): string {
    if (this.electronService.isElectron) {
      // Get system language from Electron
      const locale = navigator.language.toLowerCase();
      console.log('Navigator locale:', locale);

      if (locale.startsWith('pt')) {
        return 'pt-br';
      }
      return 'en';
    }

    // Fallback for browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('pt')) {
      return 'pt-br';
    }
    return 'en';
  }

  ngOnInit() {
    this.translate.addLangs(['pt-br', 'en']);
    this.translate.setFallbackLang('en');

    // Detect system language
    const savedLang = localStorage.getItem('user-language');
    const systemLang = this.getSystemLanguage();
    const langToUse = savedLang || systemLang;

    console.log('System language:', systemLang);
    console.log('Saved language:', savedLang);
    console.log('Using language:', langToUse);

    this.translate.use(langToUse);

    console.log('APP_CONFIG', APP_CONFIG);

    if (this.electronService.isElectron) {
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
