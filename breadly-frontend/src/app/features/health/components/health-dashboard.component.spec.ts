import { HealthDashboardComponent } from './health-dashboard.component';
import { HealthResponse } from '../../../generated/api';
import { renderWithProviders, screen } from '../../../../testing/render-with-providers';

describe('HealthDashboardComponent', () => {
  it('renders API and Database check items with response times', async () => {
    await setup(mockHealth);

    expect(screen.getByText('HEALTH.API')).toBeInTheDocument();
    expect(screen.getByText('HEALTH.DATABASE')).toBeInTheDocument();
    expect(screen.getByText('12ms')).toBeInTheDocument();
    expect(screen.getByText('5ms')).toBeInTheDocument();
  });

  it('shows all operational message when status is ok', async () => {
    await setup(mockHealth);

    expect(screen.getByText('HEALTH.ALL_OPERATIONAL')).toBeInTheDocument();
  });

  it('shows degraded message when status is degraded', async () => {
    await setup(degradedHealth);

    expect(screen.getByText('HEALTH.DEGRADED')).toBeInTheDocument();
  });

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

  async function setup(health: HealthResponse) {
    return renderWithProviders(HealthDashboardComponent, {
      componentInputs: { health },
    });
  }
});
