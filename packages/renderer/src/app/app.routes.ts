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
];
