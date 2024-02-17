import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  standalone: true,
})
export class DetailComponent implements OnInit {
  ngOnInit(): void {
    console.log('DetailComponent INIT');
  }
}
