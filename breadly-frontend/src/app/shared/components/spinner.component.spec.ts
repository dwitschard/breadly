import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '../../../testing/render-with-providers';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  async function setup(size: 'sm' | 'md' | 'lg' = 'md') {
    return renderWithProviders(SpinnerComponent, { componentInputs: { size } });
  }

  it('renders with role status', async () => {
    await setup();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies sm size classes', async () => {
    await setup('sm');
    const el = screen.getByTestId('spinner');
    expect(el.classList.toString()).toContain('h-4');
    expect(el.classList.toString()).toContain('w-4');
  });

  it('applies lg size classes', async () => {
    await setup('lg');
    const el = screen.getByTestId('spinner');
    expect(el.classList.toString()).toContain('h-12');
  });

  it('has aria-label', async () => {
    await setup();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label');
  });
});
