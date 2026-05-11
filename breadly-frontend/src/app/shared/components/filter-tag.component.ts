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
      'rounded-tag px-3 py-1 text-sm font-medium border transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2';
    const disabledClass = this.disabled() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    const stateClass = this.active()
      ? 'bg-brand-muted border-brand text-brand-hover'
      : 'bg-surface-card border-border text-content-muted hover:bg-surface-raised hover:border-border-strong';
    return `${base} ${stateClass} ${disabledClass}`;
  });

  protected onClick(): void {
    if (!this.disabled()) this.toggled.emit(!this.active());
  }
}
