import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService, IMessage } from '../../engine/services/data.service';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

interface IMessageGroup {
  date: string;
  dateObj: Date;
  messages: IMessage[];
}

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [CommonModule, TranslatePipe, RouterLink, IonContent, IonSpinner],
})
export class DetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  dataService = inject(DataService);

  @ViewChild(IonContent) content!: IonContent;

  contactJid: string = '';
  contactName: string = '';
  messages: IMessage[] = [];
  messageGroups: IMessageGroup[] = [];
  loading: boolean = true;
  error: string | null = null;
  mediaPaths = new Map<number, string>();
  loadingMedia = new Set<number>();

  constructor() {}

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

        // Group messages by date
        this.messageGroups = this.groupMessagesByDate();

        // Auto-scroll to bottom after messages load
        setTimeout(() => this.scrollToBottom(), 100);

        // Load media asynchronously in background
        this.loadMediaForMessages();
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

    return actualDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDateSeparator(timestamp: number): string {
    const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();
    const actualDate = new Date(appleEpoch + timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today
    if (actualDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    }

    // Check if it's yesterday
    if (actualDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }

    // Otherwise return formatted date (e.g., "15/12/2023")
    return actualDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private groupMessagesByDate(): IMessageGroup[] {
    const groups: IMessageGroup[] = [];
    const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();

    this.messages.forEach(message => {
      const messageDate = new Date(appleEpoch + message.date * 1000);
      const dateKey = messageDate.toDateString();

      let group = groups.find(g => g.dateObj.toDateString() === dateKey);

      if (!group) {
        group = {
          date: this.formatDateSeparator(message.date),
          dateObj: messageDate,
          messages: [],
        };
        groups.push(group);
      }

      group.messages.push(message);
    });

    return groups;
  }

  scrollToBottom(): void {
    console.log({ scrollbottom: this.content });
    if (this.content) {
      this.content.scrollToBottom(300);
    }
  }

  async loadMediaForMessages(): Promise<void> {
    const backup = this.dataService.selectedBackup;
    if (!backup || !backup.chatStorage || !backup.path) return;

    const messagesWithMedia = this.messages.filter(m => m.mediaItemId);

    // Load media in batches to avoid overwhelming the system
    for (const message of messagesWithMedia) {
      if (!message.mediaItemId || this.loadingMedia.has(message.mediaItemId)) {
        continue;
      }

      this.loadingMedia.add(message.mediaItemId);

      try {
        const result = await window.ipc.toMainGetMediaPath(
          backup.chatStorage,
          backup.path,
          message.mediaItemId,
        );

        if (result.ok === 1 && result.path) {
          this.mediaPaths.set(message.mediaItemId, result.path);
        }
      } catch (err) {
        console.error('Error loading media:', err);
      } finally {
        this.loadingMedia.delete(message.mediaItemId);
      }

      // Small delay between requests to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  getMediaPath(mediaItemId?: number | null): string | null {
    if (!mediaItemId) return null;
    return this.mediaPaths.get(mediaItemId) || null;
  }
}
