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
            <div class="h-2 w-2 rounded-full bg-brand"></div>
          }
        </div>
      </div>
      @if (label()) {
        <span class="text-sm text-content select-none">{{ label() }}</span>
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
      'flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-base';
    if (this.checked()) return `${base} border-brand bg-surface-card`;
    if (this.error()) return `${base} border-danger bg-surface-card`;
    return `${base} border-border bg-surface-card hover:border-brand-focus`;
  });

  protected onSelect(): void {
    if (!this.disabled()) this.selected.emit(this.value());
  }
}
