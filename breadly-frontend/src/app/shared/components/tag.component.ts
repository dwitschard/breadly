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
  readonly dot = input<boolean>(false);

  protected readonly tagClass = computed(() => {
    const base = 'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium';
    const variants: Record<TagVariant, string> = {
      success: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
      danger: 'bg-danger-bg-strong text-danger-text',
      neutral: 'bg-surface-raised text-content-muted',
      info: 'bg-blue-100  text-blue-700  dark:bg-blue-950  dark:text-blue-400',
      disabled: 'bg-surface-raised text-content-subtle',
    };
    return `${base} ${variants[this.variant()]}`;
  });

  protected readonly dotClass = computed(() => {
    const base = 'size-1 rounded-full shrink-0';
    const dots: Record<TagVariant, string> = {
      success: 'bg-green-500',
      danger: 'bg-danger',
      neutral: 'bg-border-strong',
      info: 'bg-blue-500',
      disabled: 'bg-border',
    };
    return `${base} ${dots[this.variant()]}`;
  });
}
