import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center p-8" aria-live="polite" aria-busy="true">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
        role="status"
      >
        <span class="sr-only">Laden...</span>
      </div>
    </div>
  `,
})
export class SpinnerComponent {}
