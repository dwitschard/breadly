import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { HealthContainerComponent } from './health.container';
import { HealthResponse, provideApi } from '../../../generated/api';

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({
      COMMON: { RELOAD: 'Aktualisieren' },
      HEALTH: {
        TITLE: 'Systemstatus',
        VERSIONS: 'Versionen',
        VERSIONS_LABEL: 'Versionen',
        CHECKS_LABEL: 'Systemstatus-Prüfungen',
        LOAD_ERROR: 'Systemstatus konnte nicht abgerufen werden.',
        API: 'API',
        DATABASE: 'Datenbank',
        OPERATIONAL: 'Betriebsbereit',
        ERROR: 'Fehler',
        OVERALL_STATUS: 'Gesamtstatus:',
        ALL_OPERATIONAL: 'Alle Systeme betriebsbereit',
        DEGRADED: 'Eingeschränkt',
      },
    });
  }
}

const mockHealth: HealthResponse = {
  status: 'ok' as HealthResponse.StatusEnum,
  checks: {
    api: { status: 'ok' as any, responseTime: '10ms' },
    database: { status: 'ok' as any, responseTime: '5ms' },
  },
};

describe('HealthContainerComponent', () => {
  let fixture: ComponentFixture<HealthContainerComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HealthContainerComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideApi('api')],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    const translate = TestBed.inject(TranslateService);
    translate.use('de');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(HealthContainerComponent);
    fixture.detectChanges();

    httpMock.expectOne('api/health').flush(mockHealth);
    httpMock.expectOne('api/version').flush({ version: 'abc1234', releaseUrl: '' });
    httpMock.expectOne('version.json').flush({ version: 'def5678', releaseUrl: '' });

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders health-dashboard when health data is available', async () => {
    fixture = TestBed.createComponent(HealthContainerComponent);
    fixture.detectChanges();

    httpMock.expectOne('api/health').flush(mockHealth);
    httpMock.expectOne('api/version').flush({ version: 'abc1234', releaseUrl: '' });
    httpMock.expectOne('version.json').flush({ version: 'def5678', releaseUrl: '' });
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('health-dashboard')).toBeTruthy();
  });

  it('renders version-info component', () => {
    fixture = TestBed.createComponent(HealthContainerComponent);
    fixture.detectChanges();

    httpMock.expectOne('api/health').flush(mockHealth);
    httpMock.expectOne('api/version').flush({ version: 'abc1234', releaseUrl: '' });
    httpMock.expectOne('version.json').flush({ version: 'def5678', releaseUrl: '' });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('health-version-info')).toBeTruthy();
  });

  it('shows dev fallback when version requests fail', () => {
    fixture = TestBed.createComponent(HealthContainerComponent);
    fixture.detectChanges();

    httpMock.expectOne('api/health').flush(mockHealth);
    httpMock.expectOne('api/version').error(new ProgressEvent('error'));
    httpMock.expectOne('version.json').error(new ProgressEvent('error'));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const versionInfo = el.querySelector('health-version-info');
    expect(versionInfo).toBeTruthy();
    expect(versionInfo?.textContent).toContain('dev');
  });
});
