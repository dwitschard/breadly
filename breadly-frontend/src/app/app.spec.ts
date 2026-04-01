import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { App } from './app';
import { ConfigService } from './config/config.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideOAuthClient(),
      ],
    }).compileComponents();

    TestBed.inject(ConfigService).setConfig({
      issuer: 'https://example.com',
      clientId: 'test-client-id',
    });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the layout shell when config is loaded', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('app-layout')).toBeTruthy();
  });
});
