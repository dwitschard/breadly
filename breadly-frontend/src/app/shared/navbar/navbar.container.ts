import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ProfileService } from '../../features/profile/profile.service';
import { NAV_LINKS } from '../../config/nav.config';
import { NavbarComponent } from './navbar.component';

@Component({
  selector: 'app-navbar-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent],
  template: `
    <app-navbar
      [contentLinks]="contentLinks()"
      [isLoggedIn]="authService.isLoggedIn()"
      [profile]="profileService.profile()"
      (profileClick)="router.navigate(['/profile'])"
      (logoutClick)="authService.logout()"
      (loginClick)="router.navigate(['/login'])"
    />
  `,
})
export class NavbarContainerComponent {
  protected readonly authService = inject(AuthService);
  protected readonly profileService = inject(ProfileService);
  protected readonly router = inject(Router);

  readonly contentLinks = computed(() => {
    const isLoggedIn = this.authService.isLoggedIn();
    return NAV_LINKS.filter((link) => !link.requiresAuth || isLoggedIn);
  });
}
