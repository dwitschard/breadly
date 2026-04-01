import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RecipesService, CreateRecipeDto, Recipe } from '../../generated/api';

@Injectable({ providedIn: 'root' })
export class RecipeFeatureService {
  private readonly api = inject(RecipesService);

  readonly recipesResource = rxResource({
    stream: () => this.api.getRecipes(),
  });

  createRecipe(dto: CreateRecipeDto): void {
    this.api.createRecipe(dto).subscribe({
      next: () => this.recipesResource.reload(),
    });
  }

  deleteRecipe(recipe: Recipe): void {
    if (!recipe._id) return;
    this.api.deleteRecipe(recipe._id).subscribe({
      next: () => this.recipesResource.reload(),
    });
  }
}
