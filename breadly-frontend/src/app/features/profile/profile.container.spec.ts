import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ProfileContainerComponent } from './profile.container';
import { ProfileService } from '../../shared/services/profile.service';
import { Profile, provideApi } from '../../generated/api';

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({
      PROFILE: {
        TITLE: 'Profil',
        FIRST_NAME: 'Vorname',
        LAST_NAME: 'Nachname',
        EMAIL: 'E-Mail',
        VERIFIED: 'Verifiziert',
        UNVERIFIED: 'Nicht verifiziert',
        EMAIL_VERIFIED: 'E-Mail verifiziert',
        EMAIL_NOT_VERIFIED: 'E-Mail nicht verifiziert',
        USER_ID: 'Benutzer-ID',
        ROLES: 'Rollen',
        UNAVAILABLE: 'Profilinformationen sind nicht verfügbar.',
        LOADING: 'Profil wird geladen...',
      },
    });
  }
}

const mockProfile: Profile = {
  sub: 'user-1',
  email: 'alice@example.com',
  emailVerified: true,
  roles: [],
};

describe('ProfileContainerComponent', () => {
  let fixture: ComponentFixture<ProfileContainerComponent>;
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileContainerComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideApi('api')],
    }).compileComponents();

    TestBed.inject(TranslateService).use('de');

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(ProfileContainerComponent);
    fixture.detectChanges();
    httpMock.expectOne('api/profile').flush(mockProfile);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls ProfileService.load() on init when profile is null', () => {
    const loadSpy = vi.spyOn(service, 'load');
    fixture = TestBed.createComponent(ProfileContainerComponent);
    fixture.detectChanges();
    httpMock.expectOne('api/profile').flush(mockProfile);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT call ProfileService.load() when profile is already set', () => {
    service['_profile'].set(mockProfile);
    const loadSpy = vi.spyOn(service, 'load');

    fixture = TestBed.createComponent(ProfileContainerComponent);
    fixture.detectChanges();
    httpMock.expectNone('api/profile');

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('renders app-profile child component', () => {
    fixture = TestBed.createComponent(ProfileContainerComponent);
    fixture.detectChanges();
    httpMock.expectOne('api/profile').flush(mockProfile);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('profile-view')).toBeTruthy();
  });
});
