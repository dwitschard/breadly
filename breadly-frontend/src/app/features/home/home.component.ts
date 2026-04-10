import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <h1 data-testid="home-title" class="text-4xl font-bold text-gray-900">
        {{ 'HOME.TITLE' | translate }}
      </h1>
      <p class="text-lg text-gray-500 max-w-md">
        {{ 'HOME.SUBTITLE' | translate }}
      </p>
      @if (!isLoggedIn()) {
        <button
          type="button"
          data-testid="home-login-btn"
          (click)="loginClick.emit()"
          class="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {{ 'HOME.LOGIN_BUTTON' | translate }}
        </button>
      }
    </main>
  `,
})
export class HomeComponent {
  readonly isLoggedIn = input.required<boolean>();
  readonly loginClick = output();
}
