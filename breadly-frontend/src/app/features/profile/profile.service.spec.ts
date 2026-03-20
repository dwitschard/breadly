import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProfileService } from './profile.service';
import { UserProfile } from './profile.types';

const mockProfile: UserProfile = {
  sub: 'user-1',
  email: 'alice@example.com',
  emailVerified: true,
  roles: ['admin'],
};

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
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
    httpMock.expectOne('/api/profile').flush(mockProfile);
    expect(service.loading()).toBe(false);
  });

  it('sets profile signal on successful load', () => {
    service.load();
    httpMock.expectOne('/api/profile').flush(mockProfile);
    expect(service.profile()).toEqual(mockProfile);
  });

  it('sets loading to false on HTTP error', () => {
    service.load();
    httpMock.expectOne('/api/profile').error(new ErrorEvent('network error'));
    expect(service.loading()).toBe(false);
  });

  it('leaves profile as null on HTTP error', () => {
    service.load();
    httpMock.expectOne('/api/profile').error(new ErrorEvent('network error'));
    expect(service.profile()).toBeNull();
  });

  it('clear() resets profile to null', () => {
    service.load();
    httpMock.expectOne('/api/profile').flush(mockProfile);
    expect(service.profile()).not.toBeNull();

    service.clear();
    expect(service.profile()).toBeNull();
  });
});
