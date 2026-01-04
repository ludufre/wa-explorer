import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonRouterOutlet,
  IonButton,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { DataService } from '../../engine/services';
import { TranslatePipe } from '@ngx-translate/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PickupPage } from '../pickup/pickup.page';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonRouterOutlet,
    IonButton,
    IonSearchbar,
    RouterLink,
    DatePipe,
    TranslatePipe,
    FaIconComponent,
    PickupPage,
    ScrollingModule,
  ],
})
export class ViewerComponent {
  data = inject(DataService);
  router = inject(Router);

  searchQuery = signal('');

  get hasBackupSelected(): boolean {
    return (this.data.sessions() || []).length > 0;
  }

  filteredSessions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.data.sessions();
    }
    return this.data
      .sessions()
      .filter(s => s.name.toLowerCase().includes(query));
  });

  handleSearch(event: any) {
    this.searchQuery.set(event.target.value || '');
  }

  async handleBackToPickup() {
    // Close database cache before clearing data
    const backup = this.data.selectedBackup;
    if (backup?.chatStorage && backup?.path) {
      await window.ipc.toMainCloseBackup(backup.chatStorage, backup.path);
    }

    this.data.sessions.set([]);
    this.data.selectedBackup = null;
    this.router.navigate(['/viewer']);
  }
}
