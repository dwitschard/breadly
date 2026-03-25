import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { provideApi, PublicConfig } from './generated/api';
import { ConfigService } from './config/config.service';

export const configLoadError = signal(false);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideApi('/api'),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideOAuthClient({
      resourceServer: {
        sendAccessToken: true,
        allowedUrls: ['/api'],
      },
    }),
    provideAppInitializer(async () => {
      const http = inject(HttpClient);
      const configService = inject(ConfigService);

      try {
        const config = await firstValueFrom(http.get<PublicConfig>('/api/public/config'));
        configService.setConfig(config.idp);
      } catch {
        configLoadError.set(true);
      }
    }),
  ],
};
