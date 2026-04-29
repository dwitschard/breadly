import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { ProfileService } from '../shared/services/profile.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, Observable, of, switchMap } from 'rxjs';

export interface AuthGuardOptions {
  roles?: string[];
}

export function withAuth(options: AuthGuardOptions = {}): CanActivateFn {
  return (_, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const profileService = inject(ProfileService);

    return toObservable(authService.isLoggedIn).pipe(
      switchMap((loggedIn) => {
        if (!loggedIn) {
          return of(
            router.createUrlTree(['/login'], {
              queryParams: { returnUrl: state.url },
            }),
          ) as Observable<boolean | UrlTree>;
        }

        if (options.roles?.length) {
          if (profileService.loading()) {
            return toObservable(profileService.loading).pipe(
              filter((loading) => !loading),
              map(() => {
                const userRoles = profileService.profile()?.roles ?? [];
                return options.roles!.some((role) => userRoles.includes(role))
                  ? true
                  : router.createUrlTree(['/']);
              }),
            );
          }

          const userRoles = profileService.profile()?.roles ?? [];
          const hasRole = options.roles!.some((role) => userRoles.includes(role));
          if (!hasRole) {
            return of(router.createUrlTree(['/'])) as Observable<boolean | UrlTree>;
          }
        }

        return of(true) as Observable<boolean | UrlTree>;
      }),
    );
  };
}
