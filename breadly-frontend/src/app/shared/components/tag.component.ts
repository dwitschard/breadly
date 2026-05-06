import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TagVariant = 'success' | 'danger' | 'neutral' | 'info' | 'disabled';

@Component({
  selector: 'app-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="tagClass()" data-testid="tag">
      @if (dot()) {
        <span [class]="dotClass()" data-testid="tag-dot" aria-hidden="true"></span>
      }
      <ng-content />
    </span>
  `,
})
export class TagComponent {
  readonly variant = input<TagVariant>('neutral');
  readonly dot     = input<boolean>(false);

  protected readonly tagClass = computed(() => {
    const base = 'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium';
    const variants: Record<TagVariant, string> = {
      success:  'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
      danger:   'bg-red-100   text-red-700   dark:bg-red-950   dark:text-red-400',
      neutral:  'bg-warm-100  text-warm-600  dark:bg-warm-800  dark:text-warm-300',
      info:     'bg-blue-100  text-blue-700  dark:bg-blue-950  dark:text-blue-400',
      disabled: 'bg-warm-100  text-warm-400  dark:bg-warm-800  dark:text-warm-600',
    };
    return `${base} ${variants[this.variant()]}`;
  });

  protected readonly dotClass = computed(() => {
    const base = 'size-1 rounded-full shrink-0';
    const dots: Record<TagVariant, string> = {
      success:  'bg-green-500',
      danger:   'bg-red-500',
      neutral:  'bg-warm-400',
      info:     'bg-blue-500',
      disabled: 'bg-warm-300',
    };
    return `${base} ${dots[this.variant()]}`;
  });
}
