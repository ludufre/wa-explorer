import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { APP_CONFIG } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  public debug = !APP_CONFIG.production;

  constructor(private platform: Platform) {}

  static factory(appLoadService: MainService) {
    return () => appLoadService.init();
  }

  private init(): Promise<void> {
    return new Promise(resolve => {
      this.platform.ready().then(async () => {
        resolve();
      });
    });
  }
}
