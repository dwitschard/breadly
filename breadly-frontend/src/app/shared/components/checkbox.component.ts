import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      <label
        class="flex items-start gap-2 cursor-pointer"
        [class.opacity-50]="disabled()"
        [class.cursor-not-allowed]="disabled()"
        data-testid="checkbox-label"
      >
        <div class="relative flex h-4 w-4 shrink-0 mt-0.5">
          <input
            type="checkbox"
            class="peer sr-only"
            [checked]="checked()"
            [disabled]="disabled()"
            [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
            data-testid="checkbox-input"
            (change)="onToggle()"
          />
          <div
            [class]="boxClass()"
            aria-hidden="true"
          >
            @if (checked() && !indeterminate()) {
              <svg viewBox="0 0 10 8" fill="none" class="h-2.5 w-2.5 text-white stroke-current stroke-2">
                <path d="M1 4l3 3 5-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            }
            @if (indeterminate()) {
              <svg viewBox="0 0 10 2" fill="none" class="h-0.5 w-2.5 text-white stroke-current stroke-2">
                <path d="M1 1h8" stroke-linecap="round" />
              </svg>
            }
          </div>
        </div>
        @if (label()) {
          <span class="text-sm text-warm-900 dark:text-warm-50 select-none">{{ label() }}</span>
        }
      </label>
      @if (error() && _touched() && helperText()) {
        <p class="text-xs text-red-600 dark:text-red-400 ml-6" data-testid="checkbox-helper">
          {{ helperText() }}
        </p>
      }
    </div>
  `,
})
export class CheckboxComponent {
  readonly checked       = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly disabled      = input<boolean>(false);
  readonly error         = input<boolean>(false);
  readonly label         = input<string>('');
  readonly helperText    = input<string>('');

  readonly checkedChange = output<boolean>();

  readonly _touched = signal(false);

  protected readonly boxClass = computed(() => {
    const base =
      'flex h-4 w-4 items-center justify-center rounded border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2';
    const checked = this.checked() || this.indeterminate();
    const hasError = this.error() && this._touched();
    if (checked) return `${base} bg-amber-600 border-amber-600 dark:bg-amber-500 dark:border-amber-500`;
    if (hasError) return `${base} border-red-500 bg-white dark:bg-warm-900`;
    return `${base} border-warm-300 bg-white hover:border-amber-400 dark:border-warm-600 dark:bg-warm-900`;
  });

  protected onToggle(): void {
    if (this.disabled()) return;
    this._touched.set(true);
    this.checkedChange.emit(!this.checked());
  }
}
