import { Injectable } from '@angular/core';
import Swal, { SweetAlertPosition, SweetAlertOptions } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class GlobalService {
  toast(
    text: string,
    title: string = null,
    icon: 'warning' | 'error' | 'success' | 'info' | 'question' = 'info',
    position: SweetAlertPosition = 'top',
    timer = 1500,
  ) {
    Swal.fire({
      title: title || text,
      text:
        !!text && !text.startsWith('!HTML!') ? (!!title ? text : null) : null,
      html: text?.startsWith('!HTML!') === true ? text.substr(6) : null,
      timer,
      icon,
      toast: true,
      timerProgressBar: true,
      position,
      showConfirmButton: false,
    });
  }

  // async showAlert(msg: string, title: string, btns: AlertButton[] = null, inputs: AlertInput[] = null, dismiss: any = null) {
  alert(
    text: string,
    title: string = null,
    icon: 'warning' | 'error' | 'success' | 'info' | 'question' = 'info',
    position: SweetAlertPosition = 'center',
    timer = 0,
  ): Promise<any> {
    return Swal.fire({
      title: title || text,
      text:
        !!text && !text.startsWith('!HTML!') ? (!!title ? text : null) : null,
      html: text?.startsWith('!HTML!') === true ? text.substr(6) : null,
      timer,
      icon,
      toast: false,
      timerProgressBar: true,
      position,
      showConfirmButton: true,
      heightAuto: false,
    });
  }

  ask(
    text: string,
    title: string = null,
    labels: string[],
    icon: 'warning' | 'error' | 'success' | 'info' | 'question' = 'question',
    position: SweetAlertPosition = 'center',
  ): Promise<void | boolean> {
    if (labels?.length !== 2 && labels?.length !== 3) {
      throw Error('ask() need to have 2 or 3 values in "labels".');
    }
    return new Promise(async (ok, nook) => {
      const config: SweetAlertOptions = {
        title: title || text,
        text:
          !!text && !text.startsWith('!HTML!') ? (!!title ? text : null) : null,
        html: text?.startsWith('!HTML!') === true ? text.substr(6) : null,
        icon,
        toast: false,
        timerProgressBar: true,
        position,
        heightAuto: false,

        showDenyButton: true,
        showConfirmButton: true,
        showCancelButton: false,
        denyButtonText: labels[1],
        confirmButtonText: labels[0],
        cancelButtonText: null,
        confirmButtonColor: 'var(--ion-color-primary)',
        denyButtonColor: 'var(--ion-color-secondary)',
        cancelButtonColor: 'var(--ion-color-tertiary)',
      };
      if (labels.length === 3) {
        config.showCancelButton = true;
        config.cancelButtonText = labels[2];
      }
      const clicked = await Swal.fire(config);
      if (labels.length === 3) {
        if (clicked.isConfirmed === true) {
          return ok(true);
        } else if (clicked.isDenied === true) {
          return ok(false);
        } else {
          return nook();
        }
      } else {
        if (clicked.isConfirmed === true) {
          return ok();
        } else {
          return nook();
        }
      }
    });
  }

  isJSON(str: any) {
    if (typeof str === 'object') {
      return true;
    }
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
