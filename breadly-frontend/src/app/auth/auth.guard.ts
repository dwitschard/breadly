import { inject, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { combineLatest, filter, map, Observable, skipWhile, take } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfileService } from '../shared/services/profile.service';

export interface AuthGuardOptions {
  roles?: string[];
}

export function withAuth(options: AuthGuardOptions = {}): CanActivateFn {
  return (_, state): boolean | UrlTree | Observable<boolean | UrlTree> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (!options.roles?.length) {
      return true;
    }

    const profileService = inject(ProfileService);
    const injector = inject(Injector);

    // Fast path: profile already loaded.
    const currentProfile = profileService.profile();
    if (currentProfile !== null) {
      const hasRole = options.roles.some((role) => currentProfile.roles.includes(role));
      return hasRole || router.createUrlTree(['/']);
    }

    // Async path: profile not loaded yet (page reload race condition).
    // skipWhile drops the initial idle state [null, false] before load() has started.
    // filter waits until loading completes (profile present, or load finished with error).
    return combineLatest([
      toObservable(profileService.profile, { injector }),
      toObservable(profileService.loading, { injector }),
    ]).pipe(
      skipWhile(([profile, loading]) => profile === null && !loading),
      filter(([profile, loading]) => profile !== null || !loading),
      take(1),
      map(([profile]) => {
        const userRoles = profile?.roles ?? [];
        const hasRole = options.roles!.some((role) => userRoles.includes(role));
        return hasRole || router.createUrlTree(['/']);
      }),
    );
  };
}
