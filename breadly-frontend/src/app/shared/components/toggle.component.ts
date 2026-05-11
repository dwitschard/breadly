import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <span [class]="thumbClass()"></span>
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
  readonly label = input<string>('');
  readonly labelPosition = input<'left' | 'right'>('right');

  readonly toggled = output<boolean>();

  protected readonly containerClass = computed(
    () =>
      `inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2 ${this.disabled() ? 'opacity-50 cursor-not-allowed' : ''}`,
  );

  protected readonly trackClass = computed(
    () =>
      `relative h-5 w-9 rounded-full transition-colors duration-base ${this.on() ? 'bg-brand' : 'bg-border'}`,
  );

  protected readonly thumbClass = computed(
    () =>
      `absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] duration-200 ${this.on() ? 'left-[18px]' : 'left-0.5'}`,
  );

  protected toggle(): void {
    if (!this.disabled()) this.toggled.emit(!this.on());
  }
}
