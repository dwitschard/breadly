import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-logout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <h1 class="text-2xl font-semibold text-gray-900">You have been logged out</h1>
      <p class="text-gray-500">Your session has ended successfully.</p>
      <button
        type="button"
        (click)="login()"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Login again
      </button>
    </main>
  `,
})
export class LogoutComponent {
  private readonly authService = inject(AuthService);

  login(): void {
    this.authService.login();
  }
}
