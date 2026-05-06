import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, Type } from '@angular/core';
import { SpinnerComponent } from './spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent, NgComponentOutlet],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="computedClass()"
      data-testid="button"
      [attr.aria-busy]="loading() ? 'true' : null"
      (click)="clicked.emit()"
    >
      @if (loading()) {
        <app-spinner size="sm" data-testid="button-spinner" />
      } @else if (icon()) {
        <ng-container
          [ngComponentOutlet]="icon()!"
          [ngComponentOutletInputs]="{ size: 16, strokeWidth: 1.5 }"
        />
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant  = input<ButtonVariant>('primary');
  readonly disabled = input<boolean>(false);
  readonly loading  = input<boolean>(false);
  readonly type     = input<'button' | 'submit' | 'reset'>('button');
  readonly icon     = input<Type<unknown> | null>(null);

  readonly clicked = output<void>();

  protected readonly computedClass = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 h-[38px] min-w-[44px] px-4 text-sm font-medium leading-none rounded-[10px] border cursor-pointer select-none whitespace-nowrap transition-all duration-[120ms] ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-amber-600 text-amber-950 border-transparent hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400',
      secondary:
        'bg-transparent text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-700 dark:text-amber-400 dark:border-amber-400 dark:hover:bg-warm-800',
      ghost:
        'bg-transparent text-warm-600 border-transparent hover:bg-warm-100 hover:text-warm-900 dark:text-warm-400 dark:hover:bg-warm-800 dark:hover:text-warm-50',
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
