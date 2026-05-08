import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './settings.service';
import { UserSettingsDto, provideApi } from '../../generated/api';

const mockTranslateService = {
  use: () => ({ subscribe: () => {} }),
};

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApi('api'),
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    });
    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    httpMock.verify();
  });

  it('starts with default language de', () => {
    expect(service.language()).toBe('de');
  });

  it('starts with default theme light', () => {
    expect(service.theme()).toBe('light');
  });

  describe('initialize', () => {
    it('sets language and theme from settings', () => {
      service.initialize({
        language: UserSettingsDto.LanguageEnum.En,
        theme: UserSettingsDto.ThemeEnum.Dark,
      });

      expect(service.language()).toBe('en');
      expect(service.theme()).toBe('dark');
    });

    it('applies dark class to html element on dark theme', () => {
      service.initialize({
        language: UserSettingsDto.LanguageEnum.De,
        theme: UserSettingsDto.ThemeEnum.Dark,
      });
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('updateSetting', () => {
    it('applies optimistic update to theme signal', () => {
      service.updateSetting('theme', 'dark');

      expect(service.theme()).toBe('dark');
      httpMock.expectOne((req) => req.url.includes('/profile/settings') && req.method === 'PATCH');
    });

    it('applies optimistic update to language signal', () => {
      service.updateSetting('language', 'en');

      expect(service.language()).toBe('en');
      httpMock.expectOne((req) => req.url.includes('/profile/settings') && req.method === 'PATCH');
    });

    it('reverts theme signal on PATCH failure', () => {
      service.initialize({
        language: UserSettingsDto.LanguageEnum.De,
        theme: UserSettingsDto.ThemeEnum.Light,
      });
      service.updateSetting('theme', 'dark');
      expect(service.theme()).toBe('dark');

      httpMock
        .expectOne((req) => req.url.includes('/profile/settings') && req.method === 'PATCH')
        .error(new ErrorEvent('network error'));

      expect(service.theme()).toBe('light');
    });

    it('reverts language signal on PATCH failure', () => {
      service.initialize({
        language: UserSettingsDto.LanguageEnum.De,
        theme: UserSettingsDto.ThemeEnum.Light,
      });
      service.updateSetting('language', 'en');
      expect(service.language()).toBe('en');

      httpMock
        .expectOne((req) => req.url.includes('/profile/settings') && req.method === 'PATCH')
        .error(new ErrorEvent('network error'));

      expect(service.language()).toBe('de');
    });

    it('retains updated value on PATCH success', () => {
      service.updateSetting('theme', 'dark');

      httpMock
        .expectOne((req) => req.url.includes('/profile/settings') && req.method === 'PATCH')
        .flush({ language: 'de', theme: 'dark' });

      expect(service.theme()).toBe('dark');
    });
  });
});
