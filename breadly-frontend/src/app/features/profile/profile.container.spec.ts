import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProfileContainerComponent } from './profile.container';
import { ProfileService } from '../../shared/services/profile.service';
import { Profile, provideApi } from '../../generated/api';

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
      imports: [ProfileContainerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideApi('api')],
    }).compileComponents();

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
