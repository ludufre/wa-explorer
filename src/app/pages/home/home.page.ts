import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../engine/services';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  constructor(
    public elec: ElectronService
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter() { }

}
