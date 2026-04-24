import { HealthDashboardComponent } from './health-dashboard.component';
import { HealthResponse } from '../../../generated/api';
import { renderWithProviders, screen } from '../../../../testing/render-with-providers';

describe('HealthDashboardComponent', () => {
  it('renders API and Database check items', async () => {
    await setup({ health: mockHealth, apiResponseTime: '142ms' });

    expect(screen.getByText('HEALTH.API')).toBeInTheDocument();
    expect(screen.getByText('HEALTH.DATABASE')).toBeInTheDocument();
  });

  it('displays apiResponseTime in the API check row when provided', async () => {
    await setup({ health: mockHealth, apiResponseTime: '142ms' });

    expect(screen.getByTestId('health-check-api-time')).toHaveTextContent('142ms');
  });

  it('displays empty API time when apiResponseTime is undefined', async () => {
    await setup({ health: mockHealth });

    expect(screen.getByTestId('health-check-api-time')).toHaveTextContent('');
  });

  it('does not render a DB time span', async () => {
    await setup({ health: mockHealth });

    expect(screen.queryByTestId('health-check-db-time')).not.toBeInTheDocument();
  });

  it('shows all operational message when status is ok', async () => {
    await setup({ health: mockHealth });

    expect(screen.getByText('HEALTH.ALL_OPERATIONAL')).toBeInTheDocument();
  });

  it('shows degraded message when status is degraded', async () => {
    await setup({ health: degradedHealth });

    expect(screen.getByText('HEALTH.DEGRADED')).toBeInTheDocument();
  });

  const mockHealth: HealthResponse = {
    status: 'ok' as HealthResponse.StatusEnum,
    checks: {
      api: { status: 'ok' as any },
      database: { status: 'ok' as any },
    },
  };

  const degradedHealth: HealthResponse = {
    status: 'degraded' as HealthResponse.StatusEnum,
    checks: {
      api: { status: 'ok' as any },
      database: { status: 'degraded' as any },
    },
  };

  async function setup(options: { health: HealthResponse; apiResponseTime?: string }) {
    return renderWithProviders(HealthDashboardComponent, {
      componentInputs: {
        health: options.health,
        ...(options.apiResponseTime !== undefined
          ? { apiResponseTime: options.apiResponseTime }
          : {}),
      },
    });
  }
});
