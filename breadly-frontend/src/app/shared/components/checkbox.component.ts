import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      <label
        class="flex items-start gap-4 cursor-pointer"
        [class.opacity-50]="disabled()"
        [class.cursor-not-allowed]="disabled()"
        data-testid="checkbox-label"
      >
        <div class="relative flex h-6 w-6 shrink-0">
          <input
            type="checkbox"
            class="peer sr-only"
            [checked]="checked()"
            [disabled]="disabled()"
            [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
            data-testid="checkbox-input"
            (change)="onToggle()"
          />
          <div [class]="boxClass()" aria-hidden="true">
            @if (checked() && !indeterminate()) {
              <svg
                viewBox="0 0 10 8"
                fill="none"
                class="h-3.5 w-3.5 text-white stroke-current stroke-2"
              >
                <path d="M1 4l3 3 5-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            }
            @if (indeterminate()) {
              <svg
                viewBox="0 0 10 2"
                fill="none"
                class="h-0.5 w-3.5 text-white stroke-current stroke-2"
              >
                <path d="M1 1h8" stroke-linecap="round" />
              </svg>
            }
          </div>
        </div>
        @if (label()) {
          <span class="text-sm text-content select-none">
            {{ label() }}
            @if (required()) {
              <span class="ml-0.5 text-danger" aria-hidden="true">*</span>
            }
          </span>
        }
      </label>
      @if ((error() || warning()) && _touched() && helperText()) {
        <p class="ml-10 text-xs" [class]="helperClass()" data-testid="checkbox-helper">
          {{ helperText() }}
        </p>
      }
    </div>
  `,
})
export class CheckboxComponent {
  readonly checked = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly warning = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly label = input<string>('');
  readonly helperText = input<string>('');

  readonly checkedChange = output<boolean>();

  readonly _touched = signal(false);

  protected readonly boxClass = computed(() => {
    const base =
      'flex h-6 w-6 items-center justify-center rounded border transition-colors duration-base focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2';
    const isChecked = this.checked() || this.indeterminate();
    const hasError = this.error() && this._touched();
    const hasWarning = this.warning() && this._touched();
    if (isChecked && hasWarning) return `${base} bg-warning border-warning`;
    if (isChecked) return `${base} bg-brand border-brand hover:bg-brand-hover hover:border-brand-hover`;
    if (hasError) return `${base} border-danger bg-surface-card`;
    if (hasWarning) return `${base} border-warning bg-surface-card hover:bg-warning-bg`;
    return `${base} border-border bg-surface-card hover:bg-brand-muted hover:border-brand-focus`;
  });

  protected readonly helperClass = computed(() => {
    if (this.error() && this._touched()) return 'text-danger-text';
    if (this.warning() && this._touched()) return 'text-warning-text';
    return 'text-content-subtle';
  });

  protected onToggle(): void {
    if (this.disabled()) return;
    this._touched.set(true);
    this.checkedChange.emit(!this.checked());
  }
}
