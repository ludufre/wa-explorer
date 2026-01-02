import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Events } from './events.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { NavController } from '@ionic/angular';
import { GlobalService } from './global.service';

@Injectable({ providedIn: 'root' })
export class ApiService {

  candy: string;
  apiUrl = '';
  payload: string;
  bitwise: string;
  token: string;

  constructor(
    public http: HttpClient,
    public events: Events,
    public g: GlobalService,
    public loadBar: LoadingBarService,
    public ng: NgZone,
    public navCtrl: NavController
  ) { }

  public call(
    method: string,
    type: 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'upload' | 'download' = 'get',
    dataOut: any = null,
    supressExpired: boolean = false,
    loadBarRef = 'main'
  ): Promise<any> {
    const hds = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/json',
    };

    if (!dataOut || !(dataOut instanceof FormData)) {
      hds['Content-Type'] = 'application/json; charset=utf-8';
    }

    return new Promise((resolve, reject) => {
      this.ng.run(() => this.loadBar.useRef(loadBarRef).start());
      this.http.request(type.toUpperCase(), `${this.apiUrl}/${method}`, {
        headers: hds,
        responseType: 'json',
        body: dataOut,
        observe: 'response'
      }).toPromise().then((data: HttpResponse<any>) => {
        if (!this.g.isJSON(data.body) && data.status === 200) {
          reject({ msg: 'Ocorreu uma falha inesperada. Incidente será reportado para equipe técnica. [C01]', code: 200 });
          return;
        }
        return resolve(data.body);
      }, (err: HttpErrorResponse) => {
        if (err.status === 401 && !supressExpired) {
          this.events.publish('user:logout');
          return;
        }
        if (this.g.isJSON(err.error)) {
          if (err.error.isTrusted) {
            return reject({ msg: 'Ocorreu uma falha inesperada. Incidente será reportado para equipe técnica. [C02]' });
          }
          if (err.error.msg) {
            return reject(err.error);
          } else {
            return reject({ msg: 'Ocorreu uma falha inesperada. Incidente será reportado para equipe técnica. [C03]' });
          }
        } else {
          return reject({ msg: 'Ocorreu uma falha inesperada. Incidente será reportado para equipe técnica. [C04]', code: err.status });
        }
      }).catch(() =>
        reject({ msg: 'Ocorreu uma falha inesperada. Incidente será reportado para equipe técnica. [C06]', code: -1 })
      ).finally(() => this.ng.run(() => this.loadBar.useRef(loadBarRef).complete()));
    });
  }

}
