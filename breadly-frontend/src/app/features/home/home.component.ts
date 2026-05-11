import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <h1 data-testid="home-title" class="text-4xl font-bold text-content">
        {{ 'HOME.TITLE' | translate }}
      </h1>
      <p class="text-lg text-content-subtle max-w-md">
        {{ 'HOME.SUBTITLE' | translate }}
      </p>
      @if (!isLoggedIn()) {
        <button
          type="button"
          data-testid="home-login-btn"
          (click)="loginClick.emit()"
          class="px-6 py-3 text-sm font-medium text-white bg-brand rounded-control hover:bg-brand-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-focus"
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
