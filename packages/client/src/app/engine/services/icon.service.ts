import { Injectable, inject } from '@angular/core';
import {
  faSync,
  faCloudArrowDown,
  faCloudArrowUp,
  faTemperatureHigh,
  faImage,
  faMapPin,
} from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary, FaConfig } from '@fortawesome/angular-fontawesome';

@Injectable({ providedIn: 'root' })
export class IconService {
  fa = inject(FaIconLibrary);
  fac = inject(FaConfig);

  constructor() {
    this.fac.defaultPrefix = 'fas';
    this.fac.fixedWidth = true;
    this.fac.fallbackIcon = faSync;
    this.fa.addIcons(
      faSync,
      faCloudArrowDown,
      faCloudArrowUp,
      faTemperatureHigh,
      faImage,
      faMapPin,
    );
  }
}
