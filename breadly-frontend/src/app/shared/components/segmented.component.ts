import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SegmentedOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      class="inline-flex rounded-lg border border-warm-300 dark:border-warm-600 overflow-hidden"
      [class.opacity-50]="disabled()"
      [class.pointer-events-none]="disabled()"
      data-testid="segmented"
    >
      @for (opt of options(); track opt.value; let i = $index; let last = $last) {
        <button
          type="button"
          [class]="segmentClass(opt.value, i, last)"
          [attr.aria-pressed]="value() === opt.value"
          data-testid="segmented-option"
          (click)="select(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
})
export class SegmentedComponent {
  readonly options  = input.required<SegmentedOption[]>();
  readonly value    = input.required<string>();
  readonly disabled = input<boolean>(false);

  readonly valueChange = output<string>();

  protected segmentClass(optValue: string, index: number, last: boolean): string {
    const base = 'px-4 h-9 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400';
    const border = index === 0 ? '' : 'border-l border-warm-300 dark:border-warm-600';
    const selected = this.value() === optValue;
    const stateClass = selected
      ? 'bg-amber-600 text-white dark:bg-amber-500'
      : 'bg-white text-warm-700 hover:bg-warm-50 dark:bg-warm-900 dark:text-warm-300 dark:hover:bg-warm-800';
    return `${base} ${border} ${stateClass}`;
  }

  protected select(optValue: string): void {
    if (!this.disabled()) this.valueChange.emit(optValue);
  }
}
