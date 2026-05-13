import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div
      [class]="spinnerClass()"
      role="status"
      data-testid="spinner"
      [attr.aria-label]="'COMMON.LOADING' | translate"
    >
      <span class="sr-only">{{ 'COMMON.LOADING' | translate }}</span>
    </div>
  `,
})
export class SpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly spinnerClass = computed(() => {
    const base = 'animate-spin rounded-full border-border-subtle border-t-brand';
    const sizes: Record<string, string> = {
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-4',
      lg: 'h-12 w-12 border-4',
    };
    return `${base} ${sizes[this.size()]}`;
  });
}
