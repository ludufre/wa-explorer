import { Injectable } from '@angular/core';
import {
  faSync,
  faComments,
  faFileExport,
  faFileImport,
  faCodeMerge,
  faRobot,
  faMobileAlt,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary, FaConfig } from '@fortawesome/angular-fontawesome';

@Injectable({ providedIn: 'root' })
export class IconService {

  constructor(
    private fa: FaIconLibrary,
    private fac: FaConfig
  ) {
    this.fac.defaultPrefix = 'fas';
    this.fac.fixedWidth = true;
    this.fac.fallbackIcon = faSync;
    this.fa.addIcons(
      faSync,
      faComments,
      faFileExport,
      faFileImport,
      faCodeMerge,
      faRobot,
      faMobileAlt,
      faChevronLeft,
    );
  }
}
