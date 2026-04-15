import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ProfileService } from '../shared/services/profile.service';

export interface AuthGuardOptions {
  roles?: string[];
}

export function withAuth(options: AuthGuardOptions = {}): CanActivateFn {
  return (_, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (options.roles?.length) {
      const profileService = inject(ProfileService);
      const userRoles = profileService.profile()?.roles ?? [];
      const hasRole = options.roles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        return router.createUrlTree(['/']);
      }
    }

    return true;
  };
}
