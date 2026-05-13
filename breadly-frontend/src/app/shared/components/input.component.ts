import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { SpinnerComponent } from './spinner.component';

@Component({
  selector: 'app-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent],
  template: `
    <div class="flex flex-col gap-1">
      @if (label()) {
        <label [for]="id" class="text-sm font-medium text-content" data-testid="input-label">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-danger" aria-hidden="true">*</span>
          }
        </label>
      }
      <div class="relative flex items-center">
        <input
          [id]="id"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [required]="required()"
          [attr.maxlength]="maxLength() ?? null"
          [attr.aria-invalid]="error() || warning() || null"
          [attr.aria-describedby]="helperText() ? helperId : null"
          [value]="value()"
          [class]="inputClass()"
          data-testid="input"
          (input)="onInput($event)"
        />
        @if (loading()) {
          <div class="absolute right-3 pointer-events-none" aria-hidden="true">
            <app-spinner size="sm" />
          </div>
        }
      </div>
      @if (maxLength()) {
        <p
          class="text-right text-xs text-content-subtle"
          [class.text-danger-text]="charCount() > maxLength()!"
          data-testid="input-count"
        >
          {{ charCount() }}/{{ maxLength() }}
        </p>
      }
      @if (helperText()) {
        <p [id]="helperId" class="text-xs" [class]="helperClass()" data-testid="input-helper">
          {{ helperText() }}
        </p>
      }
    </div>
  `,
})
export class InputComponent {
  protected readonly id = `input-${Math.random().toString(36).slice(2)}`;
  protected readonly helperId = `${this.id}-helper`;

  readonly value = input<string>('');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'search'>('text');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly warning = input<boolean>(false);
  readonly helperText = input<string>('');
  readonly maxLength = input<number | null>(null);
  readonly loading = input<boolean>(false);

  readonly valueChange = output<string>();

  protected readonly charCount = signal(0);

  protected readonly inputClass = computed(() => {
    const base =
      'w-full h-control rounded-control border px-4 text-sm bg-surface-card text-content transition-colors duration-base placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const padRight = this.loading() ? 'pr-10' : '';
    if (this.error()) return `${base} border-danger focus:ring-danger-focus ${padRight}`.trim();
    if (this.warning()) return `${base} border-warning focus:ring-warning-focus ${padRight}`.trim();
    return `${base} border-border hover:border-border-strong focus:ring-brand-focus ${padRight}`.trim();
  });

  protected readonly helperClass = computed(() => {
    if (this.error()) return 'text-danger-text';
    if (this.warning()) return 'text-warning-text';
    return 'text-content-subtle';
  });

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.charCount.set(val.length);
    this.valueChange.emit(val);
  }
}
