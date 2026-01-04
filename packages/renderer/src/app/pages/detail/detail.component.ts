import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService, IMessage } from '../../engine/services/data.service';
import { IonContent, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { MessageTypeHelper } from '../../engine/enums/message-type.enum';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Subscription } from 'rxjs';

interface IMessageGroup {
  date: string;
  dateObj: Date;
  messages: IMessage[];
}

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
    IonIcon,
    InfiniteScrollModule,
  ],
})
export class DetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  route = inject(ActivatedRoute);
  dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('messagesScrollContainer')
  private messagesScrollContainer?: ElementRef<HTMLDivElement>;

  contactJid: string = '';
  contactName: string = '';
  messages: IMessage[] = [];
  messageGroups: IMessageGroup[] = [];
  loading: boolean = true;
  error: string | null = null;
  mediaPaths = new Map<number, string>();
  loadingMedia = new Set<number>();
  showMessages: boolean = false; // Para esconder mensagens até fazer scroll pro bottom

  // Pagination properties
  private readonly PAGE_SIZE = 50;
  private readonly INITIAL_LOAD = 100;
  private currentOffset = 0;
  private totalMessages = 0;
  hasMoreMessages = false;
  isLoadingMore = false;
  private loadingPromise: Promise<void> | null = null;
  private paramsSubscription?: Subscription;
  private pendingInitialScroll = false;
  mediaViewer: {
    url: string;
    type: 'image' | 'video';
    messageId: number;
  } | null = null;

  constructor() {}

  async ngOnInit(): Promise<void> {
    // Usar subscribe ao invés de snapshot para detectar mudanças de rota
    this.paramsSubscription = this.route.paramMap.subscribe(async params => {
      const newContactJid = params.get('contact') || '';
      console.log(
        'Route params changed - old:',
        this.contactJid,
        'new:',
        newContactJid,
      );

      if (newContactJid !== this.contactJid) {
        // Reset state quando muda de conversa
        console.log('Resetando estado e carregando nova conversa');
        this.resetState();
        this.contactJid = newContactJid;

        if (!this.contactJid) {
          this.error = 'PAGES.DETAIL.NO_CONTACT';
          this.loading = false;
          return;
        }

        await this.loadMessages();
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.loadingPromise = null;
  }

  ngAfterViewChecked(): void {
    if (!this.pendingInitialScroll) {
      return;
    }

    const container = this.messagesScrollContainer?.nativeElement;
    if (!container) {
      return;
    }

    this.pendingInitialScroll = false;

    requestAnimationFrame(() => {
      this.scrollToBottom();
      setTimeout(() => {
        this.showMessages = true;
        this.cdr.markForCheck();
      }, 50);
    });
  }

  private resetState(): void {
    this.messages = [];
    this.messageGroups = [];
    this.mediaPaths.clear();
    this.loadingMedia.clear();
    this.currentOffset = 0;
    this.totalMessages = 0;
    this.hasMoreMessages = false;
    this.isLoadingMore = false;
    this.loadingPromise = null;
    this.loading = true;
    this.error = null;
    this.showMessages = false;
    this.pendingInitialScroll = false;
    this.mediaViewer = null;
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

      console.log('Fetching paginated messages for:', this.contactJid);

      // First, get total message count by loading with offset 0
      const countResult = await window.ipc.toMainGetMessagesPaginated(
        backup.chatStorage,
        backup.path,
        this.contactJid,
        1, // Load just 1 message to get total count
        0,
      );

      if (countResult.ok !== 1 || !countResult.data) {
        this.error = countResult.msg || 'PAGES.DETAIL.ERROR_LOADING_MESSAGES';
        console.error('Error from backend:', this.error);
        this.loading = false;
        return;
      }

      this.totalMessages = countResult.data.total;
      this.contactName = countResult.session?.name || this.contactJid;
      console.log(`Total messages in conversation: ${this.totalMessages}`);

      // Calculate offset to get last N messages
      const offset = Math.max(0, this.totalMessages - this.INITIAL_LOAD);
      this.currentOffset = offset;

      console.log(
        `Loading last ${this.INITIAL_LOAD} messages (offset: ${offset})`,
      );

      // Load the actual initial batch of messages
      const result = await window.ipc.toMainGetMessagesPaginated(
        backup.chatStorage,
        backup.path,
        this.contactJid,
        this.INITIAL_LOAD,
        offset,
      );

      console.log('Messages result:', result);

      if (result.ok === 1 && result.data) {
        this.messages = result.data.messages || [];
        this.hasMoreMessages = result.data.hasMore;
        console.log(
          `Loaded ${this.messages.length} messages, hasMore: ${this.hasMoreMessages}`,
        );

        // Group messages by date
        this.messageGroups = this.groupMessagesByDate();

        // CRITICAL: Set loading = false BEFORE scrolling so the div exists in DOM
        this.loading = false;

        // Aguardar renderização completa do Angular e então sinalizar o scroll pro bottom
        // Forçar detecção de mudanças primeiro
        this.cdr.detectChanges();

        if (this.messages.length > 0) {
          this.pendingInitialScroll = true;
        } else {
          this.showMessages = true;
        }

        // Load media asynchronously in background
        this.loadMediaForMessages();
      } else {
        this.error = result.msg || 'PAGES.DETAIL.ERROR_LOADING_MESSAGES';
        console.error('Error from backend:', this.error);
        this.loading = false;
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      this.error = 'PAGES.DETAIL.ERROR_LOADING_MESSAGES';
      this.loading = false;
    }
  }

  async loadMoreMessages(): Promise<void> {
    console.log('loadMoreMessages chamado', {
      hasMoreMessages: this.hasMoreMessages,
      isLoadingMore: this.isLoadingMore,
      loadingPromise: !!this.loadingPromise,
    });

    // Prevenir race conditions
    if (!this.hasMoreMessages || this.isLoadingMore || this.loadingPromise) {
      console.log('loadMoreMessages bloqueado');
      return;
    }

    console.log('loadMoreMessages iniciando...');
    this.isLoadingMore = true;

    this.loadingPromise = (async () => {
      try {
        const backup = this.dataService.selectedBackup;
        if (!backup || !backup.chatStorage || !backup.path) {
          return;
        }

        // Guardar posição de scroll ANTES de adicionar mensagens
        const scrollElement = document.querySelector(
          '.messages-scroll-container',
        );
        if (!scrollElement) return;

        const oldScrollHeight = scrollElement.scrollHeight;
        const oldScrollTop = scrollElement.scrollTop;

        console.log('Scroll before loading:', {
          scrollHeight: oldScrollHeight,
          scrollTop: oldScrollTop,
        });

        // Calcular novo offset (carregar mensagens anteriores)
        const newOffset = Math.max(0, this.currentOffset - this.PAGE_SIZE);

        console.log(
          `Loading more messages (offset: ${newOffset}, pageSize: ${this.PAGE_SIZE})`,
        );

        // Carregar mensagens via IPC
        const response = await window.ipc.toMainGetMessagesPaginated(
          backup.chatStorage,
          backup.path,
          this.contactJid,
          this.PAGE_SIZE,
          newOffset,
        );

        if (response.ok === 1 && response.data) {
          // Adicionar mensagens antigas no início
          this.messages = [...response.data.messages, ...this.messages];
          this.currentOffset = newOffset;
          this.hasMoreMessages = response.data.hasMore;

          console.log(
            `Loaded ${response.data.messages.length} more messages, total now: ${this.messages.length}, hasMore: ${this.hasMoreMessages}`,
          );

          // Re-agrupar por data
          this.messageGroups = this.groupMessagesByDate();

          // Forçar detecção de mudanças do Angular
          this.cdr.detectChanges();

          // Aguardar próximo frame de renderização
          await new Promise(resolve =>
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve(undefined));
            }),
          );

          // Restaurar posição de scroll
          const newScrollHeight = scrollElement.scrollHeight;
          const heightDifference = newScrollHeight - oldScrollHeight;
          const newScrollTop = oldScrollTop + heightDifference;

          console.log('Scroll after loading:', {
            oldScrollHeight,
            newScrollHeight,
            heightDifference,
            oldScrollTop,
            newScrollTop,
          });

          scrollElement.scrollTop = newScrollTop;

          // Carregar mídia para mensagens novas
          this.loadMediaForMessages();
        }
      } catch (error) {
        console.error('Erro ao carregar mais mensagens:', error);
      } finally {
        this.isLoadingMore = false;
        this.loadingPromise = null;
      }
    })();

    await this.loadingPromise;
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
    // Usar Map para O(n) ao invés de O(n²) com Array.find()
    const groupsMap = new Map<string, IMessageGroup>();
    const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();

    this.messages.forEach(message => {
      const messageDate = new Date(appleEpoch + message.date * 1000);
      const dateKey = messageDate.toDateString();

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, {
          date: this.formatDateSeparator(message.date),
          dateObj: messageDate,
          messages: [],
        });
      }

      groupsMap.get(dateKey)!.messages.push(message);
    });

    return Array.from(groupsMap.values());
  }

  scrollToBottom(): void {
    const scrollContainer = this.messagesScrollContainer?.nativeElement;
    console.log('scrollToBottom - container:', scrollContainer);
    if (!scrollContainer) {
      console.error('Scroll container não encontrado!');
      return;
    }

    console.log(
      'scrollHeight:',
      scrollContainer.scrollHeight,
      'scrollTop before:',
      scrollContainer.scrollTop,
    );

    const targetScroll = Math.max(
      scrollContainer.scrollHeight - scrollContainer.clientHeight,
      0,
    );
    scrollContainer.scrollTop = targetScroll;

    console.log(
      'scrollTop after:',
      scrollContainer.scrollTop,
      'target was:',
      targetScroll,
    );

    const isAtBottom =
      Math.abs(
        scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight,
      ) < 5;
    console.log('Is at bottom?', isAtBottom);

    if (!isAtBottom) {
      requestAnimationFrame(() => {
        const retryTarget = Math.max(
          scrollContainer.scrollHeight - scrollContainer.clientHeight,
          0,
        );
        scrollContainer.scrollTop = retryTarget;
        console.log('Second attempt - scrollTop:', scrollContainer.scrollTop);
      });
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

  hasRenderableMedia(message: IMessage): boolean {
    return (
      this.isImage(message) ||
      this.isVideo(message) ||
      this.isAudio(message) ||
      this.isPDF(message)
    );
  }

  openMediaViewer(
    message: IMessage,
    url: string,
    type: 'image' | 'video',
  ): void {
    this.mediaViewer = {
      url,
      type,
      messageId: message.id,
    };
  }

  closeMediaViewer(): void {
    this.mediaViewer = null;
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.mediaViewer) {
      this.closeMediaViewer();
    }
  }

  getMediaType(
    message: IMessage,
  ): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'system' | 'other' {
    return MessageTypeHelper.getMediaType(message.type);
  }

  isImage(message: IMessage): boolean {
    return MessageTypeHelper.isImage(message.type);
  }

  isVideo(message: IMessage): boolean {
    return MessageTypeHelper.isVideo(message.type);
  }

  isAudio(message: IMessage): boolean {
    return MessageTypeHelper.isAudio(message.type);
  }

  isPDF(message: IMessage): boolean {
    return MessageTypeHelper.isPDF(message.type);
  }

  isViewOnce(message: IMessage): boolean {
    return MessageTypeHelper.isViewOnce(message.type);
  }

  isSystemMessage(message: IMessage): boolean {
    return MessageTypeHelper.isSystemMessage(message.type);
  }

  downloadMedia(mediaPath: string, fileName: string): void {
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = mediaPath;
    link.download = fileName;
    link.click();
  }
}
