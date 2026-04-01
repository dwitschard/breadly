import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HealthDashboardComponent } from './health-dashboard.component';
import { HealthResponse } from '../../../generated/api';

const mockHealth: HealthResponse = {
  status: 'ok' as HealthResponse.StatusEnum,
  checks: {
    api: { status: 'ok' as any, responseTime: '12ms' },
    database: { status: 'ok' as any, responseTime: '5ms' },
  },
};

const degradedHealth: HealthResponse = {
  status: 'degraded' as HealthResponse.StatusEnum,
  checks: {
    api: { status: 'ok' as any, responseTime: '12ms' },
    database: { status: 'degraded' as any },
  },
};

describe('HealthDashboardComponent', () => {
  let fixture: ComponentFixture<HealthDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthDashboardComponent],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(HealthDashboardComponent);
    fixture.componentRef.setInput('health', mockHealth);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders API and Database check items', () => {
    fixture = TestBed.createComponent(HealthDashboardComponent);
    fixture.componentRef.setInput('health', mockHealth);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('API');
    expect(items[1].textContent).toContain('Datenbank');
  });

  it('shows all operational message when status is ok', () => {
    fixture = TestBed.createComponent(HealthDashboardComponent);
    fixture.componentRef.setInput('health', mockHealth);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Alle Systeme betriebsbereit');
  });

  it('shows degraded message when status is degraded', () => {
    fixture = TestBed.createComponent(HealthDashboardComponent);
    fixture.componentRef.setInput('health', degradedHealth);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Eingeschraenkt');
  });

  it('displays response time when available', () => {
    fixture = TestBed.createComponent(HealthDashboardComponent);
    fixture.componentRef.setInput('health', mockHealth);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('12ms');
    expect(el.textContent).toContain('5ms');
  });
});
