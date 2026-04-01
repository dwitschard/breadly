import { Routes } from '@angular/router';
import { withAuth } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'recipes',
    canActivate: [withAuth()],
    loadChildren: () => import('./features/recipes/recipes.routes').then((m) => m.RECIPES_ROUTES),
  },
  {
    path: 'health',
    canActivate: [withAuth()],
    loadChildren: () => import('./features/health/health.routes').then((m) => m.HEALTH_ROUTES),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'oidc-callback',
    loadComponent: () => import('./auth/callback.component').then((m) => m.CallbackComponent),
  },
  {
    path: 'logout',
    loadComponent: () => import('./auth/logout.component').then((m) => m.LogoutComponent),
  },
  {
    path: 'profile',
    canActivate: [withAuth()],
    loadComponent: () =>
      import('./features/profile/profile.container').then((m) => m.ProfileContainerComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.container').then((m) => m.HomeContainerComponent),
  },
  {
    path: 'recipe',
    redirectTo: 'recipes',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
