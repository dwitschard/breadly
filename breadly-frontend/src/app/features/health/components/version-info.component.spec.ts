import { VersionInfoComponent } from './version-info.component';
import { VersionInfo } from '../../../generated/api';
import { renderWithProviders, screen, within } from '../../../../testing/render-with-providers';

describe('VersionInfoComponent', () => {
  it('renders heading with HEALTH.VERSIONS key', async () => {
    await setup(withLink, withLink);

    expect(screen.getByRole('heading', { name: 'HEALTH.VERSIONS' })).toBeInTheDocument();
  });

  it('renders SHA as a link with correct attributes when releaseUrl is non-empty', async () => {
    await setup(withLink, withLink);

    const frontendItem = screen.getByTestId('health-version-frontend');
    const link = within(frontendItem).getByRole('link', { name: 'abc1234' });
    expect(link).toHaveAttribute('href', withLink.releaseUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  it('renders SHA as plain text when releaseUrl is empty', async () => {
    await setup(withoutLink, withoutLink);

    const frontendItem = screen.getByTestId('health-version-frontend');
    expect(within(frontendItem).queryByRole('link')).not.toBeInTheDocument();
    expect(within(frontendItem).getByTestId('health-version-frontend-value')).toHaveTextContent(
      'dev',
    );
  });

  it('renders both frontend and backend version entries', async () => {
    await setup(withLink, withLink);

    expect(screen.getByTestId('health-version-frontend')).toBeInTheDocument();
    expect(screen.getByTestId('health-version-backend')).toBeInTheDocument();
  });

  const withLink: VersionInfo = {
    version: 'abc1234',
    releaseUrl: 'https://github.com/org/repo/releases/tag/frontend-abc1234',
  };

  const withoutLink: VersionInfo = {
    version: 'dev',
    releaseUrl: '',
  };

  async function setup(frontendVersion: VersionInfo, backendVersion: VersionInfo) {
    return renderWithProviders(VersionInfoComponent, {
      componentInputs: { frontendVersion, backendVersion },
    });
  }
});
