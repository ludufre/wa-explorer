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
          this.g.alert(
            ret?.msg || this.translate.instant('PAGES.PICKUP.FAILED_TRY_AGAIN'),
            this.translate.instant('PAGES.PICKUP.OH'),
            'error',
          );
        }
      },
      err => {
        this.g.alert(
          err?.msg || this.translate.instant('PAGES.PICKUP.FAILED_TRY_AGAIN'),
          this.translate.instant('PAGES.PICKUP.OH'),
          'error',
        );
      },
    );
  }

  select(opt: IBackup) {
    if (!!opt.error) {
      const errorDetail = opt?.errorDetail
        ? opt.errorDetail.startsWith('PAGES.')
          ? this.translate.instant(opt.errorDetail)
          : opt.errorDetail
        : this.translate.instant('PAGES.PICKUP.NO_MORE_DETAILS');

      this.g.alert(errorDetail, this.translate.instant(opt.error), 'error');
      return;
    }
    if (!!!opt.chatStorage) {
      this.g.alert(
        this.translate.instant('PAGES.PICKUP.INVALID_MISSING'),
        this.translate.instant('PAGES.PICKUP.OH'),
        'info',
      );
      return;
    }

    this.g.showLoading(
      this.translate.instant('PAGES.PICKUP.LOADING_CHATS'),
      this.translate.instant('PAGES.PICKUP.PLEASE_WAIT'),
    );

    window.ipc.toMainChoose(opt.chatStorage, opt.path).then(
      choose => {
        this.zone.run(() => {
          this.g.hideLoading();
          this.data.sessions = choose.data;
          this.loaded = true;
        });
      },
      error => {
        this.zone.run(() => {
          this.g.hideLoading();
          this.g.alert(
            error?.message ||
              this.translate.instant('PAGES.PICKUP.FAILED_TO_LOAD_CHATS'),
            this.translate.instant('PAGES.PICKUP.ERROR'),
            'error',
          );
        });
      },
    );
  }

  dialog() {
    window.ipc
      .toMainPickupDialog()
      .then((ret: { ok: number; msg?: string; db?: string; path?: string }) => {
        if (ret.ok === 0) {
          if (!!ret?.msg) {
            this.g.alert(
              ret.msg,
              this.translate.instant('PAGES.PICKUP.OH'),
              'error',
            );
          }
          return;
        }

        this.g.showLoading(
          this.translate.instant('PAGES.PICKUP.LOADING_CHATS'),
          this.translate.instant('PAGES.PICKUP.PLEASE_WAIT'),
        );

        window.ipc.toMainChoose(ret.db!, ret.path!).then(
          choose => {
            this.zone.run(() => {
              this.g.hideLoading();
              this.data.sessions = choose.data;
              this.loaded = true;
            });
          },
          error => {
            this.zone.run(() => {
              this.g.hideLoading();
              this.g.alert(
                error?.message ||
                  this.translate.instant('PAGES.PICKUP.FAILED_TO_LOAD_CHATS'),
                this.translate.instant('PAGES.PICKUP.ERROR'),
                'error',
              );
            });
          },
        );
      });
  }
}
