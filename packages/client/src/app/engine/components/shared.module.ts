import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { OrderPipe } from '../order.pipe';

@NgModule({
  declarations: [OrderPipe],
  imports: [CommonModule, FormsModule, IonicModule, FontAwesomeModule],
  exports: [FormsModule, FontAwesomeModule, OrderPipe],
})
export class SharedModule {}
