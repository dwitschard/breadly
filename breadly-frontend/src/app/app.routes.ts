import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'recipe',
    loadComponent: () =>
      import('./features/recipes/recipes.component').then((m) => m.RecipesComponent),
  },
  {
    path: '',
    redirectTo: 'recipe',
    pathMatch: 'full',
  },
];
