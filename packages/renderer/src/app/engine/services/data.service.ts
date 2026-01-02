import { Injectable, signal } from '@angular/core';
import IBackup from '../../../../../main/interfaces/backup.interface';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  backups: IBackup[] = [];
  selectedBackup: IBackup | null = null;
  sessions = signal<ISession[]>([]);

  resetViewerState() {
    this.sessions.set([]);
    this.selectedBackup = null;
  }
}

export interface ISession {
  id: string;
  contact: string;
  name: string;
  last: Date;
  picture: string;
}

export interface IMessage {
  id: number;
  from: string;
  to: string;
  text: string;
  date: number;
  isFromMe: boolean;
  type: number;
  groupMember?: string;
}
