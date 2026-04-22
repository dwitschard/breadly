import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { App } from './app';
import { ConfigService } from './config/config.service';
import { AuthService } from './auth/auth.service';
import { renderWithProviders, screen } from '../testing/render-with-providers';

describe('App', () => {
  it('renders the layout shell when config is loaded', async () => {
    await setup({ isLoaded: true });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the config error when config has an error', async () => {
    await setup({ hasError: true });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows no layout and no error while config is still loading', async () => {
    await setup({ isLoaded: false, hasError: false });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  async function setup(options: { isLoaded?: boolean; hasError?: boolean }) {
    const { isLoaded = false, hasError = false } = options;

    const fakeConfigService = {
      isLoaded: signal(isLoaded).asReadonly(),
      hasError: signal(hasError).asReadonly(),
      getEnvironment: () => 'local',
      getConfig: () => ({ issuer: 'https://example.com', clientId: 'test-client' }),
    };

    const fakeAuthService = {
      isLoggedIn: signal(false).asReadonly(),
      login: vi.fn(),
      logout: vi.fn(),
      clearLocalSession: vi.fn(),
    };

    return renderWithProviders(App, {
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideOAuthClient(),
        { provide: ConfigService, useValue: fakeConfigService },
        { provide: AuthService, useValue: fakeAuthService },
      ],
    });
  }
});
