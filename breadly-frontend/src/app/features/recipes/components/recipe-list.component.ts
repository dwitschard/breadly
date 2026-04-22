import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideTrash2 } from '@lucide/angular';
import { Recipe } from '../../../generated/api';

@Component({
  selector: 'recipe-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideTrash2, TranslateModule],
  template: `
    @if (recipes().length === 0) {
      <p data-testid="recipe-empty-message" class="text-gray-500">
        {{ 'RECIPES.EMPTY' | translate }}
      </p>
    } @else {
      <ul data-testid="recipe-list" class="space-y-2">
        @for (recipe of recipes(); track recipe._id) {
          <li
            data-testid="recipe-list-item"
            class="flex items-center justify-between border border-gray-200 rounded px-4 py-3"
          >
            <span>{{ recipe.name }}</span>
            <button
              type="button"
              [attr.data-testid]="'recipe-delete-btn-' + recipe._id"
              (click)="deleteRecipe.emit(recipe)"
              class="text-red-600 hover:text-red-800 cursor-pointer"
              [attr.aria-label]="'RECIPES.DELETE_LABEL' | translate: { name: recipe.name }"
            >
              <svg lucideTrash2 [size]="16" aria-hidden="true" />
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class RecipeListComponent {
  readonly recipes = input.required<Recipe[]>();
  readonly deleteRecipe = output<Recipe>();
}
