import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { ConfigService } from '../config/config.service';
import { ProfileService } from '../shared/services/profile.service';

describe('AuthService', () => {
  let service: AuthService;
  let oauthService: OAuthService;
  let baseURISpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideOAuthClient(),
      ],
    });

    TestBed.inject(ConfigService).setConfig({
      issuer: 'https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_abc123',
      clientId: 'test-client-id',
    });

    oauthService = TestBed.inject(OAuthService);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    baseURISpy?.mockRestore();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('logout', () => {
    it('should call oauthService.logOut with logout_uri without trailing slash for root deployment', () => {
      baseURISpy = vi
        .spyOn(document, 'baseURI', 'get')
        .mockReturnValue('https://example.cloudfront.net/');
      const logOutSpy = vi.spyOn(oauthService, 'logOut');

      service.logout();

      expect(logOutSpy).toHaveBeenCalledWith({
        client_id: oauthService.clientId,
        logout_uri: 'https://example.cloudfront.net',
      });
    });

    it('should call oauthService.logOut with logout_uri without trailing slash for preview deployment', () => {
      baseURISpy = vi
        .spyOn(document, 'baseURI', 'get')
        .mockReturnValue('https://example.cloudfront.net/preview/my-branch/');
      const logOutSpy = vi.spyOn(oauthService, 'logOut');

      service.logout();

      expect(logOutSpy).toHaveBeenCalledWith({
        client_id: oauthService.clientId,
        logout_uri: 'https://example.cloudfront.net/preview/my-branch',
      });
    });

    it('should set isLoggedIn to false', () => {
      baseURISpy = vi.spyOn(document, 'baseURI', 'get').mockReturnValue('https://example.com/');
      vi.spyOn(oauthService, 'logOut');

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
    });

    it('should clear the profile', () => {
      baseURISpy = vi.spyOn(document, 'baseURI', 'get').mockReturnValue('https://example.com/');
      vi.spyOn(oauthService, 'logOut');
      const clearSpy = vi.spyOn(TestBed.inject(ProfileService), 'clear');

      service.logout();

      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
