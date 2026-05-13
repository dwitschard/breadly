import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="alert"
      class="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text"
    >
      {{ message() }}
    </div>
  `,
})
export class ErrorBannerComponent {
  readonly message = input.required<string>();
}
