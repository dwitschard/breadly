import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-config-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center p-6">
      <div class="max-w-md text-center" role="alert" aria-live="assertive">
        <h1 class="mb-2 text-xl font-semibold">Service unavailable</h1>
        <p class="text-content-muted">
          The application could not load its configuration. Please try again in a moment.
        </p>
      </div>
    </div>
  `,
})
export class ConfigErrorComponent {}
