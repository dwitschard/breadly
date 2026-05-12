import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideTrash2 } from '@lucide/angular';
import { Recipe } from '../../../generated/api';
import { ButtonComponent } from '../../../shared/components/button.component';

@Component({
  selector: 'recipe-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, ButtonComponent],
  template: `
    @if (recipes().length === 0) {
      <p data-testid="recipe-empty-message" class="text-content-subtle">
        {{ 'RECIPES.EMPTY' | translate }}
      </p>
    } @else {
      <ul data-testid="recipe-list" class="space-y-2">
        @for (recipe of recipes(); track recipe._id) {
          <li
            data-testid="recipe-list-item"
            class="flex items-center justify-between border border-border rounded px-4 py-3"
          >
            <span>{{ recipe.name }}</span>
            <app-button
              variant="ghost"
              [icon]="LucideTrash2"
              [attr.data-testid]="'recipe-delete-btn-' + recipe._id"
              [ariaLabel]="'RECIPES.DELETE_LABEL' | translate: { name: recipe.name }"
              (clicked)="deleteRecipe.emit(recipe)"
            />
          </li>
        }
      </ul>
    }
  `,
})
export class RecipeListComponent {
  protected readonly LucideTrash2 = LucideTrash2;
  readonly recipes = input.required<Recipe[]>();
  readonly deleteRecipe = output<Recipe>();
}
