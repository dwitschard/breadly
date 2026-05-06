import { describe, expect, it } from 'vitest';
import { LucideBell } from '@lucide/angular';
import { renderWithProviders, screen } from '../../../testing/render-with-providers';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  async function setup(count: number | null = null) {
    return renderWithProviders(BadgeComponent, {
      componentInputs: { icon: LucideBell, count },
    });
  }

  it('renders the badge container', async () => {
    await setup();
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('shows no count bubble when count is null', async () => {
    await setup(null);
    expect(screen.queryByTestId('badge-count')).not.toBeInTheDocument();
  });

  it('shows count when count is provided', async () => {
    await setup(3);
    expect(screen.getByTestId('badge-count')).toHaveTextContent('3');
  });

  it('clamps count at 99+', async () => {
    await setup(150);
    expect(screen.getByTestId('badge-count')).toHaveTextContent('99+');
  });
});
