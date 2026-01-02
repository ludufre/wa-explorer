import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [TranslatePipe, FaIconComponent],
})
export class HomePage {
  router = inject(Router);

  features = [
    {
      id: 'read-backup',
      icon: 'comments',
      titleKey: 'PAGES.HOME.FEATURES.READ_BACKUP',
      enabled: true,
      action: () => this.router.navigate(['/viewer']),
    },
    {
      id: 'export-chats',
      icon: 'file-export',
      titleKey: 'PAGES.HOME.FEATURES.EXPORT',
      enabled: false,
    },
    {
      id: 'import-chat',
      icon: 'file-import',
      titleKey: 'PAGES.HOME.FEATURES.IMPORT',
      enabled: false,
    },
    {
      id: 'merge-chats',
      icon: 'code-merge',
      titleKey: 'PAGES.HOME.FEATURES.MERGE',
      enabled: false,
    },
    {
      id: 'convert-android',
      icon: 'robot',
      titleKey: 'PAGES.HOME.FEATURES.CONVERT_ANDROID',
      enabled: false,
    },
    {
      id: 'convert-ios',
      icon: 'mobile-alt',
      titleKey: 'PAGES.HOME.FEATURES.CONVERT_IOS',
      enabled: false,
    },
  ];

  handleFeatureClick(feature: any) {
    if (feature.enabled) {
      feature.action();
    }
  }
}
