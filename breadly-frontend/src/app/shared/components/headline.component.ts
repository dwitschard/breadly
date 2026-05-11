import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type HeadlineLevel = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'muted' | 'caption';

@Component({
  selector: 'app-headline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[class]': 'computedClass()',
    '[attr.role]': 'ariaRole()',
    '[attr.aria-level]': 'ariaLevel()',
    '[attr.data-testid]': '"headline"',
    style: 'display: block',
  },
})
export class HeadlineComponent {
  readonly level = input<HeadlineLevel>('body');

  protected readonly computedClass = computed(() => {
    const classes: Record<HeadlineLevel, string> = {
      display: 'text-5xl font-medium leading-tight tracking-tight text-content',
      h1: 'text-4xl font-medium leading-tight tracking-tight text-content',
      h2: 'text-2xl font-medium leading-tight tracking-tight text-content',
      h3: 'text-xl  font-medium leading-snug  text-content',
      h4: 'text-lg  font-medium leading-snug  text-content',
      body: 'text-base text-content',
      muted: 'text-base text-content-muted',
      caption: 'text-xs  text-content-subtle',
    };
    return classes[this.level()];
  });

  protected readonly ariaRole = computed(() =>
    ['display', 'h1', 'h2', 'h3', 'h4'].includes(this.level()) ? 'heading' : null,
  );

  protected readonly ariaLevel = computed(() => {
    const map: Partial<Record<HeadlineLevel, number>> = {
      display: 1,
      h1: 1,
      h2: 2,
      h3: 3,
      h4: 4,
    };
    return map[this.level()] ?? null;
  });
}
