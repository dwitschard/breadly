import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-filter-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [disabled]="disabled()"
      [class]="computedClass()"
      [attr.aria-pressed]="active()"
      data-testid="filter-tag"
      (click)="onClick()"
    >
      <ng-content />
    </button>
  `,
})
export class FilterTagComponent {
  readonly active = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly toggled = output<boolean>();

  protected readonly computedClass = computed(() => {
    const base =
      'rounded-full px-3 py-1 text-sm font-medium border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2';
    const disabledClass = this.disabled() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    const stateClass = this.active()
      ? 'bg-amber-50 border-amber-600 text-amber-700 dark:bg-warm-800 dark:border-amber-500 dark:text-amber-400'
      : 'bg-white border-warm-300 text-warm-700 hover:bg-warm-50 hover:border-warm-400 dark:bg-warm-900 dark:border-warm-600 dark:text-warm-300 dark:hover:bg-warm-800';
    return `${base} ${stateClass} ${disabledClass}`;
  });

  protected onClick(): void {
    if (!this.disabled()) this.toggled.emit(!this.active());
  }
}
