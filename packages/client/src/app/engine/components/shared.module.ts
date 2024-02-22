import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { OrderPipe } from '../order.pipe';
import { SuperImgComponent } from './super-img.component';
import { ptBR } from 'date-fns/locale';
import { DateFnsConfigurationService, DateFnsModule } from 'ngx-date-fns';

@NgModule({
  declarations: [OrderPipe, SuperImgComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FontAwesomeModule,
    DateFnsModule,
  ],
  exports: [
    FormsModule,
    FontAwesomeModule,
    OrderPipe,
    SuperImgComponent,
    DateFnsModule,
  ],
})
export class SharedModule {
  constructor(private dateFnsConfig: DateFnsConfigurationService) {
    this.dateFnsConfig.setLocale(ptBR);
  }
}
