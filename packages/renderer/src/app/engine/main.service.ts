import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  static factory(appLoadService: MainService) {
    console.log('FACTORY CALLED: MainService');
    return () => appLoadService.init();
  }

  init() {}
}
