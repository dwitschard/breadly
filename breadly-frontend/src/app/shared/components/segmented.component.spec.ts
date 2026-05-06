import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { SegmentedComponent } from './segmented.component';

const OPTIONS = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'warten', label: 'Warten' },
];

describe('SegmentedComponent', () => {
  async function setup(value = 'aktiv') {
    return renderWithProviders(SegmentedComponent, {
      componentInputs: { options: OPTIONS, value },
    });
  }

  it('renders all segments', async () => {
    await setup();
    expect(screen.getAllByTestId('segmented-option')).toHaveLength(2);
  });

  it('selected segment has aria-pressed true', async () => {
    await setup('aktiv');
    const [first] = screen.getAllByTestId('segmented-option');
    expect(first).toHaveAttribute('aria-pressed', 'true');
  });

  it('emits valueChange on segment click', async () => {
    const user = userEvent.setup();
    const valueChange = vi.fn();
    await render(
      '<app-segmented [options]="options" value="aktiv" (valueChange)="valueChange($event)" />',
      {
        imports: [SegmentedComponent, TranslateModule.forRoot()],
        componentProperties: { options: OPTIONS, valueChange },
      },
    );
    const segments = screen.getAllByTestId('segmented-option');
    await user.click(segments[1]);
    expect(valueChange).toHaveBeenCalledWith('warten');
  });
});
