import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MomentModule } from 'ngx-moment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { OrderPipe } from '../order.pipe';

@NgModule({
  declarations: [
    OrderPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MomentModule,
    FontAwesomeModule,
    TranslateModule
  ],
  exports: [
    TranslateModule,
    FormsModule,
    MomentModule,
    FontAwesomeModule,
    OrderPipe
  ],
  providers: [
    TranslatePipe
  ]
})
export class SharedModule { }
