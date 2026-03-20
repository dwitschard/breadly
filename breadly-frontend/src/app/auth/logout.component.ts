import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-logout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <h1 class="text-2xl font-semibold text-gray-900">You have been logged out</h1>
      <p class="text-gray-500">Your session has ended successfully. Use the navbar to log in again.</p>
    </main>
  `,
})
export class LogoutComponent {
  constructor() {
    inject(AuthService).clearLocalSession();
  }
}
