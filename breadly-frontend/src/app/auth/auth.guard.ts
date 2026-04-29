import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { ProfileService } from '../shared/services/profile.service';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  filter,
  map,
  Observable,
  of,
  race,
  switchMap,
  take,
  timer,
} from 'rxjs';

export interface AuthGuardOptions {
  roles?: string[];
}

export function withAuth(options: AuthGuardOptions = {}): CanActivateFn {
  return (_, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const profileService = inject(ProfileService);

    return race(
      toObservable(authService.isLoggedIn).pipe(
        filter((loggedIn) => loggedIn),
        take(1),
        switchMap(() => {
          if (options.roles?.length) {
            if (profileService.loading()) {
              return toObservable(profileService.loading).pipe(
                filter((loading) => !loading),
                switchMap(() => {
                  const roles = profileService.profile()?.roles ?? [];
                  return options.roles!.some((r) => roles.includes(r))
                    ? of(true)
                    : of(router.createUrlTree(['/']));
                }),
              );
            }
            const roles = profileService.profile()?.roles ?? [];
            return options.roles!.some((r) => roles.includes(r))
              ? of(true)
              : of(router.createUrlTree(['/']));
          }
          return of(true);
        }),
      ),
      timer(5000).pipe(
        map(() =>
          router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          })
        )
      )
    ) as Observable<boolean | UrlTree>;
  };
}
