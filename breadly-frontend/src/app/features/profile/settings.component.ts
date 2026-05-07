import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UserSettingsDto } from '../../generated/api';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown.component';

@Component({
  selector: 'profile-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, DropdownComponent],
  template: `
    <div data-testid="profile-settings" class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold">{{ 'PROFILE.SETTINGS_TITLE' | translate }}</h2>

      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-500">{{ 'PROFILE.EMAIL' | translate }}</span>
        <span data-testid="settings-email" class="text-sm">{{ email() }}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-500">{{ 'PROFILE.LANGUAGE' | translate }}</span>
        <div class="w-40">
          <app-dropdown
            data-testid="settings-language-select"
            [options]="languageOptions()"
            [value]="language()"
            (valueChange)="languageChange.emit($event)"
          />
        </div>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-500">{{ 'PROFILE.THEME' | translate }}</span>
        <div class="w-40">
          <app-dropdown
            data-testid="settings-theme-select"
            [options]="themeOptions()"
            [value]="theme()"
            (valueChange)="themeChange.emit($event)"
          />
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  readonly email = input.required<string>();
  readonly language = input.required<UserSettingsDto.LanguageEnum>();
  readonly theme = input.required<UserSettingsDto.ThemeEnum>();
  readonly languageOptions = input.required<DropdownOption[]>();
  readonly themeOptions = input.required<DropdownOption[]>();
  readonly languageChange = output<string>();
  readonly themeChange = output<string>();
}
