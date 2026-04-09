import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucidePlus } from '@lucide/angular';
import { CreateRecipeDto } from '../../../generated/api';

@Component({
  selector: 'recipe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucidePlus, TranslateModule],
  template: `
    <form (ngSubmit)="onSubmit()" class="flex gap-3">
      <label for="recipe-name" class="sr-only">{{ 'RECIPES.NAME_LABEL' | translate }}</label>
      <input
        id="recipe-name"
        type="text"
        [(ngModel)]="name"
        name="name"
        [placeholder]="'RECIPES.NAME_PLACEHOLDER' | translate"
        required
        class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        [attr.aria-invalid]="name().length === 0 && submitted() ? 'true' : null"
      />
      <button
        type="submit"
        [disabled]="name().length === 0"
        [attr.aria-label]="'COMMON.ADD' | translate"
        class="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg lucidePlus [size]="18" aria-hidden="true" />
      </button>
    </form>
  `,
})
export class RecipeFormComponent {
  readonly submitRecipe = output<CreateRecipeDto>();
  readonly name = signal('');
  readonly submitted = signal(false);

  onSubmit(): void {
    this.submitted.set(true);
    const trimmed = this.name().trim();
    if (!trimmed) return;
    this.submitRecipe.emit({ name: trimmed });
    this.name.set('');
    this.submitted.set(false);
  }
}
