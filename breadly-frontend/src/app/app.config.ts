import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { provideApi } from './generated/api';
import { authErrorInterceptor } from './auth/auth-error.interceptor';

function translationPrefix(): string {
  const base = document.baseURI;
  return base.endsWith('/') ? `${base}assets/i18n/` : `${base}/assets/i18n/`;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideApi('api'),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([authErrorInterceptor])),
    provideOAuthClient({
      resourceServer: {
        sendAccessToken: true,
        allowedUrls: ['api'],
      },
    }),
    provideTranslateHttpLoader({ prefix: translationPrefix(), suffix: '.json' }),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'de',
      }),
    ),
  ],
};
