import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="alert"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ message() }}
    </div>
  `,
})
export class ErrorBannerComponent {
  readonly message = input.required<string>();
}
