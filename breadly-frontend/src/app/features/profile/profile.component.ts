import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideCircleUser } from '@lucide/angular';
import { Profile } from '../../generated/api';
import { profileDisplayName } from '../../shared/helpers/profile-display-name';

@Component({
  selector: 'profile-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCircleUser, TranslateModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  readonly profile = input.required<Profile | null>();
  readonly loading = input.required<boolean>();

  protected readonly displayName = computed(() => profileDisplayName(this.profile()));
}
