import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <p class="text-gray-500" aria-live="polite" aria-busy="true">Signing you in&hellip;</p>
    </main>
  `,
})
export class CallbackComponent {}
