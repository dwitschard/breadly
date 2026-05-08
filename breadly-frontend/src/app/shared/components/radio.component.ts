import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="flex items-center gap-2 cursor-pointer"
      [class.opacity-50]="disabled()"
      [class.cursor-not-allowed]="disabled()"
      data-testid="radio-label"
    >
      <div class="relative flex h-4 w-4 shrink-0">
        <input
          type="radio"
          class="peer sr-only"
          [checked]="checked()"
          [disabled]="disabled()"
          [value]="value()"
          data-testid="radio-input"
          (change)="onSelect()"
        />
        <div [class]="circleClass()" aria-hidden="true">
          @if (checked()) {
            <div class="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400"></div>
          }
        </div>
      </div>
      @if (label()) {
        <span class="text-sm text-warm-900 dark:text-warm-50 select-none">{{ label() }}</span>
      }
    </label>
  `,
})
export class RadioComponent {
  readonly value = input.required<string>();
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly label = input<string>('');

  readonly selected = output<string>();

  protected readonly circleClass = computed(() => {
    const base =
      'flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150';
    if (this.checked())
      return `${base} border-amber-600 bg-white dark:border-amber-500 dark:bg-warm-900`;
    if (this.error()) return `${base} border-red-500 bg-white dark:bg-warm-900`;
    return `${base} border-warm-300 bg-white hover:border-amber-400 dark:border-warm-600 dark:bg-warm-900`;
  });

  protected onSelect(): void {
    if (!this.disabled()) this.selected.emit(this.value());
  }
}
