import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { ProfileService } from '../shared/services/profile.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, Observable, of, switchMap, take } from 'rxjs';

export interface AuthGuardOptions {
  roles?: string[];
}

export function withAuth(options: AuthGuardOptions = {}): CanActivateFn {
  return (_, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const profileService = inject(ProfileService);

    return toObservable(authService.isLoggedIn).pipe(
      filter((loggedIn) => loggedIn),
      take(1),
      switchMap(() =>
        options.roles?.length
          ? toObservable(profileService.loading).pipe(
              filter((loading) => !loading),
              take(1),
              switchMap(() =>
                toObservable(profileService.profile).pipe(
                  take(1),
                  map((profile) => {
                    const roles = profile?.roles ?? [];
                    return options.roles!.some((r) => roles.includes(r))
                      ? true
                      : router.createUrlTree(['/']);
                  }),
                ),
              ),
            )
          : of(true),
      ),
    ) as Observable<boolean | UrlTree>;
  };
}
