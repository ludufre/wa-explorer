import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalService {
  constructor() { }

  isJSON(str: any) {
    if (typeof str === 'object') {
      return true;
    }
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
