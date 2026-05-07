import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UserSettingsDto } from '../../generated/api';

@Component({
  selector: 'profile-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div data-testid="profile-settings" class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold">{{ 'PROFILE.SETTINGS_TITLE' | translate }}</h2>

      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-500">{{ 'PROFILE.EMAIL' | translate }}</span>
        <span data-testid="settings-email" class="text-sm">{{ email() }}</span>
      </div>

      <div class="flex justify-between items-center">
        <label for="language-select" class="text-sm font-medium text-gray-500">
          {{ 'PROFILE.LANGUAGE' | translate }}
        </label>
        <select
          id="language-select"
          data-testid="settings-language-select"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          [value]="language()"
          (change)="languageChange.emit($any($event.target).value)"
        >
          <option value="de">{{ 'PROFILE.LANGUAGE_DE' | translate }}</option>
          <option value="en">{{ 'PROFILE.LANGUAGE_EN' | translate }}</option>
        </select>
      </div>

      <div class="flex justify-between items-center">
        <label for="theme-select" class="text-sm font-medium text-gray-500">
          {{ 'PROFILE.THEME' | translate }}
        </label>
        <select
          id="theme-select"
          data-testid="settings-theme-select"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          [value]="theme()"
          (change)="themeChange.emit($any($event.target).value)"
        >
          <option value="light">{{ 'PROFILE.THEME_LIGHT' | translate }}</option>
          <option value="dark">{{ 'PROFILE.THEME_DARK' | translate }}</option>
        </select>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  readonly email = input.required<string>();
  readonly language = input.required<UserSettingsDto.LanguageEnum>();
  readonly theme = input.required<UserSettingsDto.ThemeEnum>();
  readonly languageChange = output<string>();
  readonly themeChange = output<string>();
}
