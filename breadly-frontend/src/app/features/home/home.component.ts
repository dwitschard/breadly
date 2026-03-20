import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <h1 class="text-4xl font-bold text-gray-900">Welcome to breadly</h1>
      <p class="text-lg text-gray-500 max-w-md">
        Your personal recipe manager. Log in to manage your recipes and check the
        application health.
      </p>
      <button
        type="button"
        (click)="loginClick.emit()"
        class="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Login to get started
      </button>
    </main>
  `,
})
export class HomeComponent {
  readonly loginClick = output();
}
