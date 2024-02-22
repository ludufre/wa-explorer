import { Injectable } from '@angular/core';
import { Backup } from '../../../../../server/interfaces/backup.interface';
import { Chat } from '../../../../../server/interfaces/chat.interface';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  backups: Backup[] = [];
  selectedBackup: Backup;
  sessions: Chat[] = [];
}

export interface ISession {
  id: string;
  contact: string;
  name: string;
  last: Date;
  picture: string;
}
