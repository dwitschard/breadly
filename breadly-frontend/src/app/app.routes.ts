import { Routes } from '@angular/router';
import { withAuth } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'recipe',
    canActivate: [withAuth()],
    loadComponent: () =>
      import('./features/recipes/recipes.component').then((m) => m.RecipesComponent),
  },
  {
    path: 'health',
    canActivate: [withAuth()],
    loadComponent: () =>
      import('./features/health/health.component').then((m) => m.HealthComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'oidc-callback',
    loadComponent: () =>
      import('./auth/callback.component').then((m) => m.CallbackComponent),
  },
  {
    path: 'logout',
    loadComponent: () =>
      import('./auth/logout.component').then((m) => m.LogoutComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.container').then((m) => m.HomeContainerComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
