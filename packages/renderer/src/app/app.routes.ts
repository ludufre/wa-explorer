import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'pickup',
    pathMatch: 'full',
  },
  {
    path: 'pickup',
    loadComponent: () =>
      import('./pages/pickup/pickup.page').then(m => m.PickupPage),
  },
  {
    path: 'detail/:contact',
    loadComponent: () =>
      import('./pages/detail/detail.component').then(m => m.DetailComponent),
  },
];
