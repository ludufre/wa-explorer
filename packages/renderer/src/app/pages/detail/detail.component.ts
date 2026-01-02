import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [TranslatePipe],
})
export class DetailComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('DetailComponent INIT');
  }
}
