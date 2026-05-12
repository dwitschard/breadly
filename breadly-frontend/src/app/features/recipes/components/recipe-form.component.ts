import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucidePlus } from '@lucide/angular';
import { CreateRecipeDto } from '../../../generated/api';
import { ButtonComponent } from '../../../shared/components/button.component';

@Component({
  selector: 'recipe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslateModule, ButtonComponent],
  template: `
    <form (ngSubmit)="onSubmit()" class="flex gap-3">
      <label for="recipe-name" class="sr-only">{{ 'RECIPES.NAME_LABEL' | translate }}</label>
      <input
        id="recipe-name"
        data-testid="recipe-name-input"
        type="text"
        [(ngModel)]="name"
        name="name"
        [placeholder]="'RECIPES.NAME_PLACEHOLDER' | translate"
        required
        class="flex-1 border border-border rounded px-3 py-2 bg-surface-card text-content focus:outline-none focus:ring-2 focus:ring-brand-focus"
        [attr.aria-invalid]="name().length === 0 && submitted() ? 'true' : null"
      />
      <app-button
        type="submit"
        data-testid="recipe-add-btn"
        [icon]="LucidePlus"
        [stretch]="true"
        [disabled]="name().length === 0"
        [ariaLabel]="'COMMON.ADD' | translate"
      />
    </form>
  `,
})
export class RecipeFormComponent {
  protected readonly LucidePlus = LucidePlus;
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
