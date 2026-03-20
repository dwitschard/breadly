import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs';
import { authConfig } from './auth.config';
import { ProfileService } from '../features/profile/profile.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);

  private readonly _isLoggedIn = signal(this.oauthService.hasValidAccessToken());
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  constructor() {
    this.oauthService.setStorage(localStorage);
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      this._isLoggedIn.set(this.oauthService.hasValidAccessToken());
      this.oauthService.setupAutomaticSilentRefresh();
    });
    this.listenForLogin();
    this.listenForLogout();
  }

  private listenForLogin(): void {
    this.oauthService.events
      .pipe(
        filter((e) => e.type === 'token_received'),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this._isLoggedIn.set(true);
        this.profileService.load();
        this.router.navigate(['/recipe']);
      });
  }

  private listenForLogout(): void {
    this.oauthService.events
      .pipe(
        filter((e) => e.type === 'logout'),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this._isLoggedIn.set(false);
        this.router.navigate(['/logout']);
      });
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this._isLoggedIn.set(false);
    this.profileService.clear();
    this.oauthService.logOut({
      client_id: this.oauthService.clientId,
      logout_uri: `${window.location.origin}`,
    });
  }

  clearLocalSession(): void {
    this.oauthService.logOut(true);
    this._isLoggedIn.set(false);
    this.profileService.clear();
  }
}
