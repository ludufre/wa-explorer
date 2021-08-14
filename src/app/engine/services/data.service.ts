import { Injectable } from '@angular/core';
import IBackup from '../../../../app/src/interfaces/backup.interface';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  backups: IBackup[] = [];
  selectedBackup: IBackup;
  sessions: ISession[] = [];
}

export interface ISession {
  id: string;
  contact: string;
  name: string;
  last: Date;
  picture: string;
}
