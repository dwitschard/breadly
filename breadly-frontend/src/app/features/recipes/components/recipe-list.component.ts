import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideTrash2 } from '@lucide/angular';
import { Recipe } from '../../../generated/api';

@Component({
  selector: 'recipe-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideTrash2],
  template: `
    @if (recipes().length === 0) {
      <p class="text-gray-500">Noch keine Rezepte vorhanden. Erstelle oben ein neues.</p>
    } @else {
      <ul class="space-y-2">
        @for (recipe of recipes(); track recipe._id) {
          <li class="flex items-center justify-between border border-gray-200 rounded px-4 py-3">
            <span>{{ recipe.name }}</span>
            <button
              type="button"
              (click)="deleteRecipe.emit(recipe)"
              class="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm cursor-pointer"
              [attr.aria-label]="'Rezept loeschen: ' + recipe.name"
            >
              <svg lucideTrash2 [size]="14" aria-hidden="true" />
              Loeschen
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
