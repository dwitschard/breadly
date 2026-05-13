import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { RadioGroupComponent } from './radio-group.component';

const OPTIONS = [
  { value: 'a', label: 'Aktiv' },
  { value: 'b', label: 'Warten' },
  { value: 'c', label: 'Pause', disabled: true },
];

describe('RadioGroupComponent', () => {
  async function setup(value = '') {
    return renderWithProviders(RadioGroupComponent, {
      componentInputs: { options: OPTIONS, value, label: 'Schritttyp' },
    });
  }

  it('renders group label', async () => {
    await setup();
    expect(screen.getByTestId('radio-group-label')).toHaveTextContent('Schritttyp');
  });

  it('renders all options', async () => {
    await setup();
    expect(screen.getAllByTestId('radio-label')).toHaveLength(3);
  });

  it('marks selected option as checked', async () => {
    await setup('b');
    const inputs = screen.getAllByTestId('radio-input') as HTMLInputElement[];
    expect(inputs[1].checked).toBe(true);
  });

  it('shows required asterisk on label when required', async () => {
    await renderWithProviders(RadioGroupComponent, {
      componentInputs: { options: OPTIONS, label: 'Schritttyp', required: true },
    });
    expect(screen.getByTestId('radio-group-label')).toHaveTextContent('*');
  });

  it('shows helperText when warning', async () => {
    await renderWithProviders(RadioGroupComponent, {
      componentInputs: { options: OPTIONS, warning: true, helperText: 'Bitte prüfen' },
    });
    expect(screen.getByTestId('radio-group-helper')).toHaveTextContent('Bitte prüfen');
    expect(screen.getByTestId('radio-group-helper').className).toContain('text-warning-text');
  });

  it('emits valueChange on selection', async () => {
    const user = userEvent.setup();
    const valueChange = vi.fn();
    await render(
      '<app-radio-group [options]="options" value="" (valueChange)="valueChange($event)" />',
      {
        imports: [RadioGroupComponent, TranslateModule.forRoot()],
        componentProperties: { options: OPTIONS, valueChange },
      },
    );
    await user.click(screen.getAllByTestId('radio-label')[0]);
    expect(valueChange).toHaveBeenCalledWith('a');
  });
});
