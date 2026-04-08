import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeFeatureService } from '../recipes.service';
import { RecipeListComponent } from '../components/recipe-list.component';
import { RecipeFormComponent } from '../components/recipe-form.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner.component';
import { CreateRecipeDto, Recipe } from '../../../generated/api';

@Component({
  selector: 'recipe-list-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RecipeListComponent,
    RecipeFormComponent,
    SpinnerComponent,
    ErrorBannerComponent,
    TranslateModule,
  ],
  template: `
    <main class="p-6">
      <h1 class="text-2xl font-bold mb-6">{{ 'RECIPES.TITLE' | translate }}</h1>

      <section [attr.aria-label]="'RECIPES.ADD_TITLE' | translate" class="mb-8">
        <h2 class="text-lg font-semibold mb-3">{{ 'RECIPES.ADD_TITLE' | translate }}</h2>
        <recipe-form (submitRecipe)="onCreate($event)" />
        @if (mutationError()) {
          <div class="mt-2">
            <app-error-banner [message]="mutationError()!" />
          </div>
        }
      </section>

      <section [attr.aria-label]="'RECIPES.LIST_LABEL' | translate">
        <h2 class="text-lg font-semibold mb-3">{{ 'RECIPES.ALL_TITLE' | translate }}</h2>
        @if (recipeService.recipesResource.isLoading()) {
          <app-spinner />
        } @else if (recipeService.recipesResource.error()) {
          <app-error-banner [message]="'RECIPES.LOAD_ERROR' | translate" />
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
