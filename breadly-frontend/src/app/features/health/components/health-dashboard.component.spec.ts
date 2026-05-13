import { HealthDashboardComponent } from './health-dashboard.component';
import { HealthResponse } from '../../../generated/api';
import { renderWithProviders, screen } from '../../../../testing/render-with-providers';

describe('HealthDashboardComponent', () => {
  it('renders API, MongoDB, and DynamoDB check items', async () => {
    await setup({ health: mockHealth, apiResponseTime: '142ms' });

    expect(screen.getByText('HEALTH.API_STATUS')).toBeInTheDocument();
    expect(screen.getByText('HEALTH.DB_STATUS')).toBeInTheDocument();
    expect(screen.getByText('HEALTH.DYNAMODB_STATUS')).toBeInTheDocument();
  });

  it('displays apiResponseTime in the API check row when provided', async () => {
    await setup({ health: mockHealth, apiResponseTime: '142ms' });

    expect(screen.getByTestId('health-check-api-time')).toHaveTextContent('142ms');
  });

  it('displays empty API time when apiResponseTime is undefined', async () => {
    await setup({ health: mockHealth });

    expect(screen.getByTestId('health-check-api-time')).toHaveTextContent('');
  });

  it('shows all operational message when status is ok', async () => {
    await setup({ health: mockHealth });

    expect(screen.getByText('HEALTH.ALL_OPERATIONAL')).toBeInTheDocument();
  });

  it('shows degraded message when status is degraded', async () => {
    await setup({ health: degradedHealth });

    expect(screen.getByText('HEALTH.DEGRADED')).toBeInTheDocument();
  });

  it('shows mongodb status indicator', async () => {
    await setup({ health: mockHealth });

    const indicator = screen.getByTestId('health-check-mongodb-status');
    expect(indicator.getAttribute('data-status')).toBe('ok');
  });

  it('shows dynamodb degraded status', async () => {
    await setup({ health: dynamodbDegradedHealth });

    const indicator = screen.getByTestId('health-check-dynamodb-status');
    expect(indicator.getAttribute('data-status')).toBe('degraded');
  });

  const mockHealth: HealthResponse = {
    status: 'ok' as HealthResponse.StatusEnum,
    checks: {
      api: { status: 'ok' as any },
      mongodb: { status: 'ok' as any },
      dynamodb: { status: 'ok' as any },
    },
  };

  const degradedHealth: HealthResponse = {
    status: 'degraded' as HealthResponse.StatusEnum,
    checks: {
      api: { status: 'ok' as any },
      mongodb: { status: 'degraded' as any },
      dynamodb: { status: 'degraded' as any },
    },
  };

  const dynamodbDegradedHealth: HealthResponse = {
    status: 'degraded' as HealthResponse.StatusEnum,
    checks: {
      api: { status: 'ok' as any },
      mongodb: { status: 'ok' as any },
      dynamodb: { status: 'degraded' as any },
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
