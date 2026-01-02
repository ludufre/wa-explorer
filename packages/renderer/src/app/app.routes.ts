import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'viewer',
    loadComponent: () =>
      import('./pages/viewer/viewer.component').then(m => m.ViewerComponent),
    children: [
      {
        path: 'detail/:contact',
        loadComponent: () =>
          import('./pages/detail/detail.component').then(
            m => m.DetailComponent,
          ),
      },
    ],
  },
];
