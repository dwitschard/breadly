import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a status element with sr-only text', () => {
    const el: HTMLElement = fixture.nativeElement;
    const status = el.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status!.textContent).toContain('Laden');
  });

  it('has aria-live polite for accessibility', () => {
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('[aria-live="polite"]');
    expect(container).toBeTruthy();
  });
});
