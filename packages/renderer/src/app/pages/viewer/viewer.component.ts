import { Component, inject } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { DataService } from '../../engine/services';
import { TranslatePipe } from '@ngx-translate/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PickupPage } from '../pickup/pickup.page';

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
    RouterLink,
    DatePipe,
    TranslatePipe,
    FaIconComponent,
    PickupPage,
  ],
})
export class ViewerComponent {
  data = inject(DataService);
  router = inject(Router);

  get hasBackupSelected(): boolean {
    return this.data.sessions().length > 0;
  }

  handleBackToPickup() {
    this.data.sessions.set([]);
    this.data.selectedBackup = null;
    this.router.navigate(['/viewer']);
  }
}
