import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { SliderComponent } from './slider.component';

describe('SliderComponent', () => {
  async function setup(value = 50) {
    return renderWithProviders(SliderComponent, {
      componentInputs: { min: 0, max: 100, value, label: 'Hydration' },
    });
  }

  it('renders label', async () => {
    await setup();
    expect(screen.getByTestId('slider-label')).toHaveTextContent('Hydration');
  });

  it('shows current value', async () => {
    await setup(75);
    expect(screen.getByTestId('slider-value')).toHaveTextContent('75');
  });

  it('renders native range input', async () => {
    await setup();
    const input = screen.getByTestId('slider-input') as HTMLInputElement;
    expect(input.type).toBe('range');
    expect(input.value).toBe('50');
  });

  it('shows min and max labels', async () => {
    await setup();
    expect(screen.getByTestId('slider-min')).toHaveTextContent('0');
    expect(screen.getByTestId('slider-max')).toHaveTextContent('100');
  });

  it('is disabled when disabled input is true', async () => {
    await renderWithProviders(SliderComponent, {
      componentInputs: { min: 0, max: 100, value: 50, disabled: true },
    });
    expect(screen.getByTestId('slider-input')).toBeDisabled();
  });
});
