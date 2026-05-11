import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, Type } from '@angular/core';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    <div class="relative inline-flex" data-testid="badge">
      <ng-container
        [ngComponentOutlet]="icon()"
        [ngComponentOutletInputs]="{ size: 24, strokeWidth: 1.5 }"
      />
      @if (displayCount() !== null) {
        <span
          class="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-none text-white"
          aria-label="count"
          data-testid="badge-count"
        >
          {{ displayCount() }}
        </span>
      }
    </div>
  `,
})
export class BadgeComponent {
  readonly icon = input.required<Type<unknown>>();
  readonly count = input<number | null>(null);

  protected readonly displayCount = computed(() => {
    const c = this.count();
    if (c === null || c === undefined) return null;
    return c > 99 ? '99+' : String(c);
  });
}
