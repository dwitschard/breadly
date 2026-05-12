import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserSettingsDto } from '../../generated/api';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown.component';
import { HeadlineComponent } from '../../shared/components/headline.component';

@Component({
  selector: 'profile-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, DropdownComponent, DatePipe, HeadlineComponent],
  template: `
    <div data-testid="profile-settings" class="flex flex-col gap-4">
      <app-headline level="h4">{{ 'PROFILE.SETTINGS_TITLE' | translate }}</app-headline>

      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-content-subtle">{{
          'PROFILE.EMAIL' | translate
        }}</span>
        <span data-testid="settings-email" class="text-sm">{{ email() }}</span>
      </div>

      @if (lastLogin()) {
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-content-subtle">{{
            'PROFILE.LAST_LOGIN' | translate
          }}</span>
          <span data-testid="settings-last-login" class="text-sm">{{
            lastLogin() | date: 'medium'
          }}</span>
        </div>
      }

      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-content-subtle">{{
          'PROFILE.LANGUAGE' | translate
        }}</span>
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
        <span class="text-sm font-medium text-content-subtle">{{
          'PROFILE.THEME' | translate
        }}</span>
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
  readonly lastLogin = input<string | undefined>();
  readonly language = input.required<UserSettingsDto.LanguageEnum>();
  readonly theme = input.required<UserSettingsDto.ThemeEnum>();
  readonly languageOptions = input.required<DropdownOption[]>();
  readonly themeOptions = input.required<DropdownOption[]>();
  readonly languageChange = output<string>();
  readonly themeChange = output<string>();
}
