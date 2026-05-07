import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1.5" data-testid="slider">
      @if (label()) {
        <div class="flex items-center justify-between">
          <label
            class="text-sm font-medium text-warm-900 dark:text-warm-50"
            data-testid="slider-label"
          >
            {{ label() }}
          </label>
          <span class="text-sm text-warm-600 dark:text-warm-300" data-testid="slider-value">{{
            value()
          }}</span>
        </div>
      }

      <input
        type="range"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="value()"
        [disabled]="disabled()"
        class="w-full h-1 rounded-full cursor-pointer accent-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:accent-amber-500"
        data-testid="slider-input"
        (input)="onInput($event)"
      />

      <div class="flex justify-between">
        <span class="text-xs text-warm-500 dark:text-warm-400" data-testid="slider-min">{{
          min()
        }}</span>
        <span class="text-xs text-warm-500 dark:text-warm-400" data-testid="slider-max">{{
          max()
        }}</span>
      </div>
    </div>
  `,
})
export class SliderComponent {
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly value = input<number>(50);
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('');

  readonly valueChange = output<number>();

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.valueChange.emit(Number(input.value));
  }
}
