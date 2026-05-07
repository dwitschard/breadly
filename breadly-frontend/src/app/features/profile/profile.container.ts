import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ProfileService } from '../../shared/services/profile.service';
import { SettingsService } from '../../shared/services/settings.service';
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
          [language]="settingsService.language()"
          [theme]="settingsService.theme()"
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

  ngOnInit(): void {
    if (!this.profileService.profile()) {
      this.profileService.load();
    }
  }
}
