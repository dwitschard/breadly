import { effect, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProfileService } from '../../generated/api';
import { PatchUserSettingsDto, UserSettingsDto } from '../../generated/api';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ProfileService);
  private readonly translate = inject(TranslateService);

  private readonly _language = signal<UserSettingsDto.LanguageEnum>(
    UserSettingsDto.LanguageEnum.De,
  );
  private readonly _theme = signal<UserSettingsDto.ThemeEnum>(UserSettingsDto.ThemeEnum.Light);

  readonly language = this._language.asReadonly();
  readonly theme = this._theme.asReadonly();

  private readonly _themeEffect = effect(() => {
    document.documentElement.classList.toggle('dark', this._theme() === 'dark');
  });

  private readonly _languageEffect = effect(() => {
    this.translate.use(this._language());
  });

  initialize(settings: UserSettingsDto): void {
    this._language.set(settings.language);
    this._theme.set(settings.theme);
  }

  updateSetting(key: keyof PatchUserSettingsDto, value: string): void {
    const prevLanguage = this._language();
    const prevTheme = this._theme();
    const patch: PatchUserSettingsDto = { [key]: value };

    if (key === 'language') this._language.set(value as UserSettingsDto.LanguageEnum);
    if (key === 'theme') this._theme.set(value as UserSettingsDto.ThemeEnum);

    this.api.updateUserSettings(patch).subscribe({
      error: () => {
        this._language.set(prevLanguage);
        this._theme.set(prevTheme);
      },
    });
  }
}
