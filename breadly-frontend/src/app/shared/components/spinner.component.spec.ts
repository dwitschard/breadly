import { SpinnerComponent } from './spinner.component';
import { renderWithProviders, screen } from '../../../testing/render-with-providers';

describe('SpinnerComponent', () => {
  it('renders a status element with translated loading label', async () => {
    await setup();

    expect(screen.getByRole('status', { name: 'COMMON.LOADING' })).toBeInTheDocument();
  });

  async function setup() {
    return renderWithProviders(SpinnerComponent);
  }
});
