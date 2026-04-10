import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NavLink } from './nav.config';
import { Profile } from '../../../generated/api';
import { ProfileMenuComponent } from './profile-menu.component';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, ProfileMenuComponent, TranslateModule],
  template: `
    <header class="flex items-center justify-between px-6 py-3 border-b border-gray-200">
      <div class="flex items-center gap-4">
        <a
          routerLink="/"
          data-testid="nav-home-link"
          class="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          [attr.aria-label]="'NAV.HOME' | translate"
        >
          breadly
        </a>

        <nav [attr.aria-label]="'NAV.MAIN_NAV' | translate">
          <ul class="flex gap-2" role="list">
            @for (link of contentLinks(); track link.path) {
              <li>
                <a
                  [routerLink]="link.path"
                  [attr.data-testid]="'nav-' + link.path.replace('/', '') + '-link'"
                  routerLinkActive="bg-gray-100 text-gray-900"
                  [routerLinkActiveOptions]="{ exact: false }"
                  class="px-3 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {{ link.labelKey | translate }}
                </a>
              </li>
            }
          </ul>
        </nav>
      </div>

      <app-profile-menu
        [profile]="profile()"
        [isLoggedIn]="isLoggedIn()"
        (profileClick)="profileClick.emit()"
        (logoutClick)="logoutClick.emit()"
        (loginClick)="loginClick.emit()"
      />
    </header>
  `,
})
export class NavbarComponent {
  readonly contentLinks = input.required<NavLink[]>();
  readonly isLoggedIn = input.required<boolean>();
  readonly profile = input.required<Profile | null>();

  readonly profileClick = output<void>();
  readonly logoutClick = output<void>();
  readonly loginClick = output<void>();
}
