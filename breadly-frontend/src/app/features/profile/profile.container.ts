import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ProfileService } from './profile.service';
import { ProfileComponent } from './profile.component';

@Component({
  selector: 'app-profile-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileComponent],
  template: `
    <app-profile
      [profile]="profileService.profile()"
      [loading]="profileService.loading()"
    />
  `,
})
export class ProfileContainerComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);

  ngOnInit(): void {
    // If navigated directly without a prior login event, fetch if not yet loaded
    if (!this.profileService.profile()) {
      this.profileService.load();
    }
  }
}
