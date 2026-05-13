import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"block animate-pulse rounded bg-surface-raised " + cssClass()',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
  template: ``,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly cssClass = input('');
}
