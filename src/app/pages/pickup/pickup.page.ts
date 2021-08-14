import { Component, OnInit } from '@angular/core';
import { DataService, ElectronService, ISession } from '../../engine/services';
import IBackup from '../../../../app/src/interfaces/backup.interface';

@Component({
  selector: 'app-pickup',
  templateUrl: './pickup.page.html',
  styleUrls: ['./pickup.page.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class PickupPage implements OnInit {
  public folder: string;

  options: IBackup[] = [];
  loaded = false;

  constructor(
    public elec: ElectronService,
    public data: DataService
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.loaded = false;
    this.options = [];
    this.elec.ipcRenderer.invoke('load').then((ret: { ok: boolean; msg: string; list: IBackup[] }) => {
      if (ret.ok) {
        this.options = ret.list;
        this.loaded = true;
      } else {
        console.log(ret?.msg || 'Failed! Try again.');
      }
    }, (err) => {
      console.log(err?.msg || 'Failed! Try again.');
    });
  }

  select(opt: IBackup) {
    this.elec.ipcRenderer.invoke('choose', opt.chatStorage, opt.path).then((ret: { ok: boolean; msg: string; data: ISession[] }) => {
      if (ret.ok) {

        this.data.sessions = ret.data;

        this.loaded = true;
      } else {
        console.log(ret?.msg || 'Failed! Try again.');
      }
    }, (err) => {
      console.log(err?.msg || 'Failed! Try again.');
    });
  }
}
