import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/components/button.component';
import { HeadlineComponent } from '../../shared/components/headline.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, ButtonComponent, HeadlineComponent],
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <app-headline level="h1" data-testid="home-title">
        {{ 'HOME.TITLE' | translate }}
      </app-headline>
      <p class="text-lg text-content-subtle max-w-md">
        {{ 'HOME.SUBTITLE' | translate }}
      </p>
      @if (!isLoggedIn()) {
        <app-button type="button" data-testid="home-login-btn" (clicked)="loginClick.emit()">
          {{ 'HOME.LOGIN_BUTTON' | translate }}
        </app-button>
      }
    </main>
  `,
})
export class HomeComponent {
  readonly isLoggedIn = input.required<boolean>();
  readonly loginClick = output();
}
