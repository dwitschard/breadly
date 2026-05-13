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
      [attr.data-testid]="testId()"
      [attr.aria-label]="ariaLabel()"
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
  readonly variant = input<ButtonVariant>('primary');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly icon = input<Type<unknown> | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly testId = input<string | null>(null);

  readonly clicked = output<void>();

  protected readonly computedClass = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 py-1 px-4 text-sm font-medium rounded-control border cursor-pointer select-none whitespace-nowrap transition-all duration-fast ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-brand text-brand-on border-transparent hover:bg-brand-hover',
      secondary:
        'bg-transparent text-brand border-brand hover:bg-brand-muted hover:text-brand-hover hover:border-brand-hover',
      ghost:
        'bg-transparent text-content-muted border-transparent hover:bg-surface-raised hover:text-content',
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
