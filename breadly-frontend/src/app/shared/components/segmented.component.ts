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
      class="inline-flex rounded-lg border border-border overflow-hidden"
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
  readonly options = input.required<SegmentedOption[]>();
  readonly value = input.required<string>();
  readonly disabled = input<boolean>(false);

  readonly valueChange = output<string>();

  protected segmentClass(optValue: string, index: number, last: boolean): string {
    const base =
      'px-4 h-8 text-sm font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-focus';
    const border = index === 0 ? '' : 'border-l border-border';
    const selected = this.value() === optValue;
    const stateClass = selected
      ? 'bg-brand text-white'
      : 'bg-surface-card text-content-muted hover:bg-surface-raised';
    return `${base} ${border} ${stateClass}`;
  }

  protected select(optValue: string): void {
    if (!this.disabled()) this.valueChange.emit(optValue);
  }
}
