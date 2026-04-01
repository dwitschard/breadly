import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ProfileService } from '../../shared/services/profile.service';
import { ProfileComponent } from './profile.component';

@Component({
  selector: 'profile-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileComponent],
  template: `
    <profile-view [profile]="profileService.profile()" [loading]="profileService.loading()" />
  `,
})
export class ProfileContainerComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);

  ngOnInit(): void {
    if (!this.profileService.profile()) {
      this.profileService.load();
    }
  }
}
