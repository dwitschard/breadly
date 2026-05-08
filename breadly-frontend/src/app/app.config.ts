import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { provideApi } from './generated/api';
import { authErrorInterceptor } from './auth/auth-error.interceptor';

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
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'de',
      }),
    ),
    provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    provideAppInitializer(() => firstValueFrom(inject(TranslateService).use('de'))),
  ],
};
