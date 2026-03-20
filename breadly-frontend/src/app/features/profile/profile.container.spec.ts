import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProfileContainerComponent } from './profile.container';
import { ProfileService } from './profile.service';
import { UserProfile } from './profile.types';

const mockProfile: UserProfile = {
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
      imports: [ProfileContainerComponent, HttpClientTestingModule],
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
    // flush the auto-triggered request
    httpMock.expectOne('/api/profile').flush(mockProfile);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls ProfileService.load() on init when profile is null', () => {
    const loadSpy = vi.spyOn(service, 'load');
    fixture = TestBed.createComponent(ProfileContainerComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/profile').flush(mockProfile);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT call ProfileService.load() when profile is already set', () => {
    // Pre-populate the service with a profile
    service['_profile'].set(mockProfile);
    const loadSpy = vi.spyOn(service, 'load');

    fixture = TestBed.createComponent(ProfileContainerComponent);
    fixture.detectChanges();
    httpMock.expectNone('/api/profile');

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('renders app-profile child component', () => {
    fixture = TestBed.createComponent(ProfileContainerComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/profile').flush(mockProfile);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-profile')).toBeTruthy();
  });
});
