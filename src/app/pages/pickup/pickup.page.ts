import { Component, OnInit } from '@angular/core';
import { DataService, ElectronService, GlobalService } from '../../engine/services';
import IBackup from '../../../../app/src/interfaces/backup.interface';
import { TranslatePipe } from '@ngx-translate/core';

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
    public data: DataService,
    public g: GlobalService,
    public translate: TranslatePipe
  ) { }

  ngOnInit() {
    this.elec.ipcRenderer.on('choosed', (event, ret) => {
      console.log(ret);
      if (ret.ok) {

        this.data.sessions = ret.data;

        this.loaded = true;
      } else {
        console.log(ret?.msg || 'Failed! Try again.');
      }
    });
  }

  ionViewDidEnter() {
    this.loaded = false;
    this.options = [];
    this.elec.ipcRenderer.invoke('load').then((ret: { ok: boolean; msg: string; itunes: IBackup[] }) => {
      console.log(ret.itunes);
      if (ret.ok) {
        this.options = ret.itunes.map(o => ({
          ...o,
          date: o.date || new Date('1900-01-01')
        }));
        this.loaded = true;
      } else {
        this.g.alert(ret?.msg || 'Failed! Try again.', 'Oh!', 'error');
      }
    }, (err) => {
      this.g.alert(JSON.stringify(err) || 'Failed! Try again. 2', 'Oh!', 'error');
    });
  }

  select(opt: IBackup) {
    if (!!opt.error) {
      this.g.alert(!!opt?.errorDetail ? opt.errorDetail : 'No more details', this.translate.transform(opt.error), 'error');
      return;
    }
    if (!!!opt.chatStorage) {
      this.g.alert(this.translate.transform('PAGES.PICKUP.INVALID_MISSING'), 'Oh!', 'info');
      return;
    }

    this.elec.ipcRenderer.send('choose', opt.chatStorage, opt.path);

    // this.elec.ipcRenderer.invoke('choose', opt.chatStorage, opt.path).then((ret: { ok: boolean; msg: string; data: ISession[] }) => {
    //   if (ret.ok) {

    //     this.data.sessions = ret.data;

    //     this.loaded = true;
    //   } else {
    //     console.log(ret?.msg || 'Failed! Try again.');
    //   }
    // }, (err) => {
    //   console.log(err?.msg || 'Failed! Try again.');
    // });
  }
}
