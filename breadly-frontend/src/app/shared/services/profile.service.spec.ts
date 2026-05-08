import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProfileService } from './profile.service';
import { SettingsService } from './settings.service';
import { Profile, UserSettingsDto, provideApi } from '../../generated/api';

const mockSettings: UserSettingsDto = {
  language: UserSettingsDto.LanguageEnum.De,
  theme: UserSettingsDto.ThemeEnum.Light,
};

const mockProfile: Profile = {
  sub: 'user-1',
  email: 'alice@example.com',
  emailVerified: true,
  name: 'Alice',
  roles: ['admin'],
  settings: mockSettings,
};

const mockSettingsService = {
  initialize: () => {},
  updateSetting: () => {},
  language: () => 'de',
  theme: () => 'light',
};

describe('ProfileService (shared)', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApi('api'),
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('profile signal starts as null', () => {
    expect(service.profile()).toBeNull();
  });

  it('loading signal starts as false', () => {
    expect(service.loading()).toBe(false);
  });

  it('sets loading to true while request is in flight', () => {
    service.load();
    expect(service.loading()).toBe(true);
    httpMock.expectOne('api/profile').flush(mockProfile);
    expect(service.loading()).toBe(false);
  });

  it('sets profile signal on successful load', () => {
    service.load();
    httpMock.expectOne('api/profile').flush(mockProfile);
    expect(service.profile()).toEqual(mockProfile);
  });

  it('sets loading to false on HTTP error', () => {
    service.load();
    httpMock.expectOne('api/profile').error(new ErrorEvent('network error'));
    expect(service.loading()).toBe(false);
  });

  it('leaves profile as null on HTTP error', () => {
    service.load();
    httpMock.expectOne('api/profile').error(new ErrorEvent('network error'));
    expect(service.profile()).toBeNull();
  });

  it('does not make a second request if already loading', () => {
    service.load();
    service.load();
    httpMock.expectOne('api/profile').flush(mockProfile);
  });

  it('does not reload once profile is already loaded', () => {
    service.load();
    httpMock.expectOne('api/profile').flush(mockProfile);

    service.load();
    httpMock.expectNone('api/profile');
  });

  it('clear() resets profile to null', () => {
    service.load();
    httpMock.expectOne('api/profile').flush(mockProfile);
    expect(service.profile()).not.toBeNull();

    service.clear();
    expect(service.profile()).toBeNull();
  });
});
