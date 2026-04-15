import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ConfigService } from '../../../config/config.service';
import { NAV_LINKS } from './nav.config';
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
      [environment]="environment()"
      [isAdmin]="isAdmin()"
      (profileClick)="router.navigate(['/profile'])"
      (logoutClick)="authService.logout()"
      (loginClick)="router.navigate(['/login'])"
      (healthClick)="router.navigate(['/health'])"
    />
  `,
})
export class NavbarContainerComponent {
  protected readonly authService = inject(AuthService);
  protected readonly profileService = inject(ProfileService);
  protected readonly router = inject(Router);
  private readonly configService = inject(ConfigService);

  readonly contentLinks = computed(() => {
    const isLoggedIn = this.authService.isLoggedIn();
    return NAV_LINKS.filter((link) => !link.requiresAuth || isLoggedIn);
  });

  readonly environment = computed(() => {
    return this.configService.isLoaded() ? this.configService.getEnvironment() : '';
  });

  readonly isAdmin = computed(() => {
    const profile = this.profileService.profile();
    return profile?.roles?.includes('ADMIN') ?? false;
  });
}
