import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ErrorBannerComponent } from './error-banner.component';

describe('ErrorBannerComponent', () => {
  let fixture: ComponentFixture<ErrorBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBannerComponent],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(ErrorBannerComponent);
    fixture.componentRef.setInput('message', 'Something went wrong');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the message', () => {
    fixture = TestBed.createComponent(ErrorBannerComponent);
    fixture.componentRef.setInput('message', 'Test error message');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Test error message');
  });

  it('has role="alert" for accessibility', () => {
    fixture = TestBed.createComponent(ErrorBannerComponent);
    fixture.componentRef.setInput('message', 'Error');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });
});
