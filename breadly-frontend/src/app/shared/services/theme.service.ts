import { inject, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly settingsService = inject(SettingsService);

  readonly theme = this.settingsService.theme;

  setTheme(theme: 'light' | 'dark'): void {
    this.settingsService.updateSetting('theme', theme);
  }
}
