import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'recipe',
    loadComponent: () =>
      import('./features/recipes/recipes.component').then((m) => m.RecipesComponent),
  },
  {
    path: 'health',
    loadComponent: () =>
      import('./features/health/health.component').then((m) => m.HealthComponent),
  },
  {
    path: 'logout',
    loadComponent: () =>
      import('./auth/logout.component').then((m) => m.LogoutComponent),
  },
  {
    path: '',
    redirectTo: 'recipe',
    pathMatch: 'full',
  },
];
