import { Injectable } from '@angular/core';
import Swal, { SweetAlertPosition } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class GlobalService {
  constructor() {}

  toast(
    text: string,
    title: string = null,
    icon: 'warning' | 'error' | 'success' | 'info' | 'question' = 'info',
    position: SweetAlertPosition = 'bottom-end',
    timer = 1500,
  ) {
    Swal.fire({
      title: title || text,
      text: !!title ? text : null,
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
      text: !!title ? text : null,
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
    labels: [string, string],
    icon: 'warning' | 'error' | 'success' | 'info' | 'question' = 'question',
    position: SweetAlertPosition = 'center',
  ): Promise<void> {
    return new Promise(async (ok, nook) => {
      const clicked = await Swal.fire({
        title: title || text,
        text: !!title ? text : null,
        icon,
        toast: false,
        timerProgressBar: true,
        position,
        heightAuto: false,

        showConfirmButton: true,
        showCancelButton: true,
        cancelButtonText: labels[1],
        confirmButtonText: labels[0],
      });
      if (clicked.isConfirmed === true) {
        return ok();
      } else {
        return nook();
      }
    });
  }

  isJSON(str: any) {
    if (typeof str === 'object') {
      return true;
    }
    try {
      JSON.parse(str);
    } catch (_) {
      return false;
    }
    return true;
  }

  private loadingInstance: any = null;

  showLoading(text: string = 'Loading...', title: string = null): void {
    this.loadingInstance = Swal.fire({
      title: title || text,
      text: !!title ? text : null,
      allowOutsideClick: false,
      heightAuto: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  hideLoading(): void {
    if (this.loadingInstance) {
      Swal.close();
      this.loadingInstance = null;
    }
  }
}
