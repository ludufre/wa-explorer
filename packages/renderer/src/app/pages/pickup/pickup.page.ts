import { Component, inject, NgZone } from '@angular/core';
import {
  DataService,
  ElectronService,
  GlobalService,
} from '../../engine/services';
import IBackup from '../../../../../main/interfaces/backup.interface';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pickup',
  templateUrl: './pickup.page.html',
  styleUrls: ['./pickup.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonButton,
    FaIconComponent,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    TranslatePipe,
  ],
})
export class PickupPage {
  elec = inject(ElectronService);
  data = inject(DataService);
  g = inject(GlobalService);
  translate = inject(TranslateService);
  zone = inject(NgZone);

  public folder: string;

  options: IBackup[] = [];
  loaded = false;

  ionViewDidEnter() {
    this.loaded = false;
    this.options = [];
    window.ipc.toMainLoad().then(
      (ret: { ok: boolean; msg: string; itunes: IBackup[] }) => {
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

  select(opt: IBackup) {
    if (!!opt.error) {
      this.g.alert(
        !!opt?.errorDetail ? opt.errorDetail : 'No more details',
        this.translate.instant(opt.error),
        'error',
      );
      return;
    }
    if (!!!opt.chatStorage) {
      this.g.alert(
        this.translate.instant('PAGES.PICKUP.INVALID_MISSING'),
        'Oh!',
        'info',
      );
      return;
    }

    window.ipc.toMainChoose(opt.chatStorage, opt.path).then(choose => {
      this.zone.run(() => {
        this.data.sessions = choose.data;
        this.loaded = true;
      });
    });
  }

  dialog() {
    window.ipc
      .toMainPickupDialog()
      .then((ret: { ok: number; msg?: string; db?: string; path?: string }) => {
        if (ret.ok === 0) {
          if (!!ret?.msg) {
            this.g.alert(ret.msg, 'Oh!', 'error');
          }
          return;
        }
        window.ipc.toMainChoose(ret.db!, ret.path!).then(choose => {
          this.zone.run(() => {
            this.data.sessions = choose.data;
            this.loaded = true;
          });
        });
      });
  }
}
