import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService, IMessage } from '../../engine/services/data.service';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [
    CommonModule,
    TranslatePipe,
    RouterLink,
    IonContent,
    IonSpinner,
  ],
})
export class DetailComponent implements OnInit {
  contactJid: string = '';
  contactName: string = '';
  messages: IMessage[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.contactJid = this.route.snapshot.paramMap.get('contact') || '';
    console.log('DetailComponent ngOnInit - contactJid:', this.contactJid);

    if (!this.contactJid) {
      this.error = 'PAGES.DETAIL.NO_CONTACT';
      this.loading = false;
      return;
    }

    await this.loadMessages();
  }

  async loadMessages(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      const backup = this.dataService.selectedBackup;
      console.log('DetailComponent loadMessages - backup:', backup);

      if (!backup || !backup.chatStorage || !backup.path) {
        console.error('No backup selected or missing chatStorage/path');
        this.error = 'PAGES.DETAIL.NO_BACKUP_SELECTED';
        this.loading = false;
        return;
      }

      console.log('Fetching messages for:', this.contactJid);
      const result = await window.ipc.toMainGetMessages(
        backup.chatStorage,
        backup.path,
        this.contactJid,
      );

      console.log('Messages result:', result);

      if (result.ok === 1) {
        this.messages = result.data || [];
        this.contactName = result.session?.name || this.contactJid;
        console.log(`Loaded ${this.messages.length} messages`);
      } else {
        this.error = result.msg || 'PAGES.DETAIL.ERROR_LOADING_MESSAGES';
        console.error('Error from backend:', this.error);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      this.error = 'PAGES.DETAIL.ERROR_LOADING_MESSAGES';
    } finally {
      this.loading = false;
    }
  }

  formatDate(timestamp: number): string {
    // WhatsApp uses Core Data timestamp (seconds since 2001-01-01)
    const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();
    const actualDate = new Date(appleEpoch + timestamp * 1000);

    return actualDate.toLocaleString();
  }

  formatTime(timestamp: number): string {
    const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();
    const actualDate = new Date(appleEpoch + timestamp * 1000);

    return actualDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
