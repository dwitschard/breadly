import { describe, expect, it } from 'vitest';
import { LucidePlus } from '@lucide/angular';
import { renderWithProviders, screen } from '../../../testing/render-with-providers';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  it('renders with aria-hidden', async () => {
    await renderWithProviders(IconComponent, {
      componentInputs: { icon: LucidePlus, size: 24, strokeWidth: 1.5 },
    });
    const el = screen.getByTestId('icon');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
});
