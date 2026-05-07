import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { startWith } from 'rxjs';
import { ProfileService } from '../../shared/services/profile.service';
import { SettingsService } from '../../shared/services/settings.service';
import { DropdownOption } from '../../shared/components/dropdown.component';
import { ProfileComponent } from './profile.component';
import { SettingsComponent } from './settings.component';

@Component({
  selector: 'profile-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileComponent, SettingsComponent],
  template: `
    <profile-view [profile]="profileService.profile()" [loading]="profileService.loading()" />
    @if (profileService.profile()) {
      <div class="max-w-xl mx-auto px-6 pb-6">
        <profile-settings
          [email]="profileService.profile()!.email"
          [language]="settingsService.language()"
          [theme]="settingsService.theme()"
          [languageOptions]="languageOptions()"
          [themeOptions]="themeOptions()"
          (languageChange)="settingsService.updateSetting('language', $event)"
          (themeChange)="settingsService.updateSetting('theme', $event)"
        />
      </div>
    }
  `,
})
export class ProfileContainerComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);
  protected readonly settingsService = inject(SettingsService);
  private readonly translate = inject(TranslateService);

  private readonly langChange = toSignal(this.translate.onLangChange.pipe(startWith(null)));

  protected readonly languageOptions = computed<DropdownOption[]>(() => {
    this.langChange();
    return [
      { value: 'de', label: this.translate.instant('PROFILE.LANGUAGE_DE') },
      { value: 'en', label: this.translate.instant('PROFILE.LANGUAGE_EN') },
    ];
  });

  protected readonly themeOptions = computed<DropdownOption[]>(() => {
    this.langChange();
    return [
      { value: 'light', label: this.translate.instant('PROFILE.THEME_LIGHT') },
      { value: 'dark', label: this.translate.instant('PROFILE.THEME_DARK') },
    ];
  });

  ngOnInit(): void {
    if (!this.profileService.profile()) {
      this.profileService.load();
    }
  }
}
