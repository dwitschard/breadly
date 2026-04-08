import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-logout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <main class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <h1 class="text-2xl font-semibold text-gray-900">{{ 'AUTH.LOGOUT_TITLE' | translate }}</h1>
      <p class="text-gray-500">
        {{ 'AUTH.LOGOUT_MESSAGE' | translate }}
      </p>
    </main>
  `,
})
export class LogoutComponent implements OnInit {
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.clearLocalSession();
  }
}
