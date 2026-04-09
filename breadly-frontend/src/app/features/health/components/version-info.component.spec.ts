import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { VersionInfoComponent } from './version-info.component';
import { VersionInfo } from '../../../generated/api';

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({
      HEALTH: {
        VERSIONS: 'Versionen',
        VERSIONS_LABEL: 'Versionen',
        FRONTEND: 'Frontend',
        BACKEND: 'Backend',
      },
    });
  }
}

const withLink: VersionInfo = {
  version: 'abc1234',
  releaseUrl: 'https://github.com/org/repo/releases/tag/frontend-abc1234',
};

const withoutLink: VersionInfo = {
  version: 'dev',
  releaseUrl: '',
};

describe('VersionInfoComponent', () => {
  let fixture: ComponentFixture<VersionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        VersionInfoComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeLoader } }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.use('de');
  });

  it('should create', () => {
    fixture = TestBed.createComponent(VersionInfoComponent);
    fixture.componentRef.setInput('frontendVersion', withLink);
    fixture.componentRef.setInput('backendVersion', withLink);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders both frontend and backend versions', () => {
    fixture = TestBed.createComponent(VersionInfoComponent);
    fixture.componentRef.setInput('frontendVersion', withLink);
    fixture.componentRef.setInput('backendVersion', withLink);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Frontend');
    expect(items[1].textContent).toContain('Backend');
  });

  it('renders SHA as a link when releaseUrl is non-empty', () => {
    fixture = TestBed.createComponent(VersionInfoComponent);
    fixture.componentRef.setInput('frontendVersion', withLink);
    fixture.componentRef.setInput('backendVersion', withLink);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].textContent?.trim()).toBe('abc1234');
    expect(links[1].textContent?.trim()).toBe('abc1234');
  });

  it('renders SHA as plain text when releaseUrl is empty', () => {
    fixture = TestBed.createComponent(VersionInfoComponent);
    fixture.componentRef.setInput('frontendVersion', withoutLink);
    fixture.componentRef.setInput('backendVersion', withoutLink);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll('a');
    expect(links.length).toBe(0);
    const spans = el.querySelectorAll('li span.text-gray-600');
    expect(spans.length).toBe(2);
    expect(spans[0].textContent?.trim()).toBe('dev');
    expect(spans[1].textContent?.trim()).toBe('dev');
  });

  it('link has correct href, target, and rel attributes', () => {
    fixture = TestBed.createComponent(VersionInfoComponent);
    fixture.componentRef.setInput('frontendVersion', withLink);
    fixture.componentRef.setInput('backendVersion', withLink);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('a')!;
    expect(link.getAttribute('href')).toBe(withLink.releaseUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
  });

  it('renders the Versionen heading', () => {
    fixture = TestBed.createComponent(VersionInfoComponent);
    fixture.componentRef.setInput('frontendVersion', withLink);
    fixture.componentRef.setInput('backendVersion', withLink);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Versionen');
  });
});
