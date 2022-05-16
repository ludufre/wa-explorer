import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PickupPage } from './pickup.page';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../engine/components/shared.module';
import { OrderPipe } from '../../engine/order.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: PickupPage
      }
    ])
  ],
  declarations: [PickupPage]
})
export class PickupPageModule { }
