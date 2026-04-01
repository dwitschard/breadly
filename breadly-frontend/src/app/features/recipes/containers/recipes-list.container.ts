import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RecipeFeatureService } from '../recipes.service';
import { RecipeListComponent } from '../components/recipe-list.component';
import { RecipeFormComponent } from '../components/recipe-form.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner.component';
import { CreateRecipeDto, Recipe } from '../../../generated/api';

@Component({
  selector: 'recipe-list-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RecipeListComponent, RecipeFormComponent, SpinnerComponent, ErrorBannerComponent],
  template: `
    <main class="p-6">
      <h1 class="text-2xl font-bold mb-6">Rezepte</h1>

      <section aria-label="Neues Rezept hinzufuegen" class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Rezept hinzufuegen</h2>
        <recipe-form (submitRecipe)="onCreate($event)" />
        @if (mutationError()) {
          <div class="mt-2">
            <app-error-banner [message]="mutationError()!" />
          </div>
        }
      </section>

      <section aria-label="Rezeptliste">
        <h2 class="text-lg font-semibold mb-3">Alle Rezepte</h2>
        @if (recipeService.recipesResource.isLoading()) {
          <app-spinner />
        } @else if (recipeService.recipesResource.error()) {
          <app-error-banner message="Rezepte konnten nicht geladen werden." />
        } @else {
          <recipe-list
            [recipes]="recipeService.recipesResource.value() ?? []"
            (deleteRecipe)="onDelete($event)"
          />
        }
      </section>
    </main>
  `,
})
export class RecipesListContainerComponent {
  protected readonly recipeService = inject(RecipeFeatureService);
  protected readonly mutationError = signal<string | null>(null);

  onCreate(dto: CreateRecipeDto): void {
    this.mutationError.set(null);
    this.recipeService.createRecipe(dto);
  }

  onDelete(recipe: Recipe): void {
    this.mutationError.set(null);
    this.recipeService.deleteRecipe(recipe);
  }
}
