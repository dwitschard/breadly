import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NAV_LINKS } from '../../config/nav.config';
import { NavbarComponent } from './navbar.component';

@Component({
  selector: 'app-navbar-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent],
  template: `
    <app-navbar
      [contentLinks]="contentLinks()"
      [isLoggedIn]="this.authService.isLoggedIn()"
      (authClick)="authAction()"
    />
  `,
})
export class NavbarContainerComponent {
  readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  readonly contentLinks = computed(() => {
    const isLoggedIn = this.authService.isLoggedIn();

    return NAV_LINKS.filter((link) => {
      return !link.requiresAuth || isLoggedIn;
    });
  });

  authAction(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.logout();
    } else {
      this.router.navigate(['/login']);
    }
  }
}
