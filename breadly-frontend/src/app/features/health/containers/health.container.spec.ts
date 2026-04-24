import { signal } from '@angular/core';
import { HealthContainerComponent } from './health.container';
import { HealthFeatureService } from '../health.service';
import { HealthResponse, VersionInfo } from '../../../generated/api';
import { renderWithProviders, screen, userEvent } from '../../../../testing/render-with-providers';

describe('HealthContainerComponent', () => {
  const user = userEvent.setup();

  it('shows spinner while loading', async () => {
    await setup({ isLoading: true });

    expect(screen.getByRole('status', { name: 'COMMON.LOADING' })).toBeInTheDocument();
  });

  it('shows error banner when health request fails', async () => {
    await setup({ healthError: new Error('network error') });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('HEALTH.LOAD_ERROR')).toBeInTheDocument();
  });

  it('renders health-dashboard when health data is available', async () => {
    await setup({ health: mockHealth });

    expect(screen.getByTestId('health-check-api')).toBeInTheDocument();
    expect(screen.getByTestId('health-check-db')).toBeInTheDocument();
  });

  it('passes apiResponseTime from service to dashboard', async () => {
    await setup({ health: mockHealth, apiResponseTime: '142ms' });

    expect(screen.getByTestId('health-check-api-time')).toHaveTextContent('142ms');
  });

  it('renders version-info with frontend and backend versions', async () => {
    await setup({ health: mockHealth });

    expect(screen.getByTestId('health-version-frontend')).toBeInTheDocument();
    expect(screen.getByTestId('health-version-backend')).toBeInTheDocument();
  });

  it('reload button calls healthService.reload()', async () => {
    const reload = vi.fn();
    await setup({ health: mockHealth, reload });

    await user.click(screen.getByRole('button', { name: 'COMMON.RELOAD' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reload button is disabled while loading', async () => {
    await setup({ isLoading: true });

    expect(screen.getByRole('button', { name: 'COMMON.RELOAD' })).toBeDisabled();
  });

  const mockHealth: HealthResponse = {
    status: 'ok' as HealthResponse.StatusEnum,
    checks: {
      api: { status: 'ok' as any },
      database: { status: 'ok' as any },
    },
  };

  const mockVersion: VersionInfo = { version: 'abc1234', releaseUrl: '' };

  async function setup(
    options: {
      health?: HealthResponse;
      isLoading?: boolean;
      healthError?: unknown;
      reload?: () => void;
      apiResponseTime?: string;
    } = {},
  ) {
    const {
      health,
      isLoading = false,
      healthError = undefined,
      reload = vi.fn(),
      apiResponseTime,
    } = options;

    const fakeHealthService = {
      healthResource: {
        value: signal<HealthResponse | undefined>(health),
        isLoading: signal(isLoading),
        error: signal<unknown>(healthError),
      },
      frontendVersionResource: { value: signal<VersionInfo | undefined>(mockVersion) },
      backendVersionResource: { value: signal<VersionInfo | undefined>(mockVersion) },
      apiResponseTime: signal<string | undefined>(apiResponseTime),
      reload,
    };

    return renderWithProviders(HealthContainerComponent, {
      componentProviders: [{ provide: HealthFeatureService, useValue: fakeHealthService }],
    });
  }
});
