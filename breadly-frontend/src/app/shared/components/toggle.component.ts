import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SpinnerComponent } from './spinner.component';

@Component({
  selector: 'app-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent],
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="on()"
      [attr.aria-label]="label() || null"
      [disabled]="disabled()"
      [class]="containerClass()"
      data-testid="toggle"
      (click)="toggle()"
    >
      @if (label() && labelPosition() === 'left') {
        <span class="text-sm text-content select-none" data-testid="toggle-label">
          {{ label() }}
        </span>
      }

      <div [class]="trackClass()" aria-hidden="true">
        @if (loading()) {
          <div class="absolute inset-0 flex items-center justify-center">
            <app-spinner size="sm" />
          </div>
        } @else {
          <span [class]="thumbClass()"></span>
        }
      </div>

      @if (label() && labelPosition() === 'right') {
        <span class="text-sm text-content select-none" data-testid="toggle-label">
          {{ label() }}
        </span>
      }
    </button>
  `,
})
export class ToggleComponent {
  readonly on = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly label = input<string>('');
  readonly labelPosition = input<'left' | 'right'>('right');

  readonly toggled = output<boolean>();

  protected readonly containerClass = computed(() => {
    const base =
      'inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2';
    const isInert = this.disabled() || this.loading();
    return `${base} ${isInert ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
  });

  protected readonly trackClass = computed(
    () =>
      `relative h-6 w-11 rounded-full transition-colors duration-base ${this.on() ? 'bg-brand' : 'bg-surface-raised'}`,
  );

  protected readonly thumbClass = computed(
    () =>
      `absolute top-px h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-[left] duration-200 ${this.on() ? 'left-[21px]' : 'left-px'}`,
  );

  protected toggle(): void {
    if (!this.disabled() && !this.loading()) this.toggled.emit(!this.on());
  }
}
