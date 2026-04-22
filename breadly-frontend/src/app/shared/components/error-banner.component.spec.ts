import { ErrorBannerComponent } from './error-banner.component';
import { renderWithProviders, screen } from '../../../testing/render-with-providers';

describe('ErrorBannerComponent', () => {
  it('renders the message in an alert region', async () => {
    await setup('Test error message');

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays a different message when input changes', async () => {
    await setup('Something went wrong');

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  async function setup(message: string) {
    return renderWithProviders(ErrorBannerComponent, {
      componentInputs: { message },
    });
  }
});
