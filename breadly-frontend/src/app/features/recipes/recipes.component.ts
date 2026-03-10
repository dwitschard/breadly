import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RecipesService } from '../../generated/api';
import { Recipe } from '../../generated/api';
import { CreateRecipeDto } from '../../generated/api';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-recipes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <main class="max-w-2xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-6">Breadly Recipes</h1>

      <section aria-label="Add a new recipe" class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Add Recipe</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex gap-3">
          <label for="recipe-name" class="sr-only">Recipe name</label>
          <input
            id="recipe-name"
            type="text"
            formControlName="name"
            placeholder="Recipe name"
            class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            [attr.aria-invalid]="form.controls.name.invalid && form.controls.name.touched ? 'true' : null"
          />
          <button
            type="submit"
            [disabled]="form.invalid"
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>
        @if (error()) {
          <p role="alert" class="mt-2 text-sm text-red-600">{{ error() }}</p>
        }
      </section>

      <section aria-label="Recipe list">
        <h2 class="text-lg font-semibold mb-3">All Recipes</h2>
        @if (loading()) {
          <p aria-live="polite">Loading recipes&hellip;</p>
        } @else if (recipes().length === 0) {
          <p class="text-gray-500">No recipes yet. Add one above.</p>
        } @else {
          <ul class="space-y-2">
            @for (recipe of recipes(); track recipe._id) {
              <li class="flex items-center justify-between border border-gray-200 rounded px-4 py-3">
                <span>{{ recipe.name }}</span>
                <button
                  type="button"
                  (click)="onDelete(recipe)"
                  class="text-red-600 hover:text-red-800 text-sm"
                  [attr.aria-label]="'Delete recipe ' + recipe.name"
                >
                  Delete
                </button>
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
})
export class RecipesComponent implements OnInit {
  private readonly recipesService = inject(RecipesService);
  private readonly fb = inject(FormBuilder);

  readonly recipes = signal<Recipe[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
  });

  ngOnInit(): void {
    this.loadRecipes();
  }

  private loadRecipes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.recipesService.getRecipes().subscribe({
      next: (data) => {
        this.recipes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load recipes.');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const dto: CreateRecipeDto = { name: this.form.controls.name.value! };
    this.recipesService.createRecipe(dto).subscribe({
      next: (created) => {
        this.recipes.update((list) => [...list, created]);
        this.form.reset();
      },
      error: () => {
        this.error.set('Failed to create recipe.');
      },
    });
  }

  onDelete(recipe: Recipe): void {
    if (!recipe._id) return;
    this.recipesService.deleteRecipe(recipe._id).subscribe({
      next: () => {
        this.recipes.update((list) => list.filter((r) => r._id !== recipe._id));
      },
      error: () => {
        this.error.set('Failed to delete recipe.');
      },
    });
  }
}
