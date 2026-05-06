import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, Type } from '@angular/core';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    <ng-container
      [ngComponentOutlet]="icon()"
      [ngComponentOutletInputs]="iconInputs()"
    />
  `,
  host: {
    '[attr.aria-hidden]': '"true"',
    '[attr.data-testid]': '"icon"',
  },
})
export class IconComponent {
  readonly icon        = input.required<Type<unknown>>();
  readonly size        = input<number>(24);
  readonly strokeWidth = input<number>(1.5);

  protected readonly iconInputs = computed(() => ({
    size:        this.size(),
    strokeWidth: this.strokeWidth(),
  }));
}
