import { Component, NgZone, OnInit, inject } from '@angular/core';
import {
  DataService,
  ElectronService,
  GlobalService,
} from '../engine/services';
import { Backup } from '../../../../server/interfaces/backup.interface';
import { IonHeader } from '@ionic/angular/standalone';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { SharedModule } from '../engine/components/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pickup',
  templateUrl: './pickup.page.html',
  styleUrls: ['./pickup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonSpinner,
    IonText,
    IonNote,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    SharedModule,
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class PickupPage implements OnInit {
  elec = inject(ElectronService);
  data = inject(DataService);
  g = inject(GlobalService);
  zone = inject(NgZone);

  public folder: string;

  options: Backup[] = [];
  loaded = false;

  ngOnInit() {
    window.appApi.choosed(ret => {
      console.log(event, ret);
      if (ret.ok) {
        this.zone.run(() => {
          this.data.sessions = ret.data;
          this.loaded = true;
        });
      } else {
        console.log(ret?.msg || 'Failed! Try again.');
      }
    });
  }

  ionViewDidEnter() {
    this.loaded = false;
    this.options = [];
    window.appApi.load().then(
      (ret: { ok: boolean; msg: string; itunes: Backup[] }) => {
        console.log(ret.itunes);
        if (ret.ok) {
          this.options = ret.itunes.map(o => ({
            ...o,
            date: o.date || new Date('1900-01-01'),
          }));
          this.loaded = true;
        } else {
          this.g.alert(ret?.msg || 'Failed! Try again.', 'Oh!', 'error');
        }
      },
      err => {
        this.g.alert(err?.msg || 'Failed! Try again.', 'Oh!', 'error');
      },
    );
  }

  select(opt: Backup) {
    if (!!opt.error) {
      this.g.alert(
        !!opt?.errorDetail ? opt.errorDetail : 'No more details',
        opt.error,
        'error',
      );
      return;
    }
    if (!!!opt.chatStorage) {
      this.g.alert('PAGES.PICKUP.INVALID_MISSING', 'Oh!', 'info');
      return;
    }

    console.log(opt);

    window.appApi.choose(opt.chatStorage, opt.path);

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

  dialog() {
    window.appApi.pickupDialog().then(ret => {
      if (ret.ok === 0) {
        if (!!ret?.msg) {
          this.g.alert(ret.msg, 'Oh!', 'error');
        }
        return;
      }
      window.appApi.choose(ret.db, ret.path);
    });
  }
}
