import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pickup',
    pathMatch: 'full',
  },
  {
    path: 'pickup',
    loadComponent: () => import('./pickup/pickup.page').then(m => m.PickupPage),
  },
];
