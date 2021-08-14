import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MomentModule } from 'ngx-moment';
import { OrderModule } from 'ngx-order-pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    IonicModule,
    OrderModule,
    MomentModule,
    FontAwesomeModule
  ],
  exports: [
    TranslateModule,
    FormsModule,
    OrderModule,
    MomentModule,
    FontAwesomeModule
  ]
})
export class SharedModule { }
