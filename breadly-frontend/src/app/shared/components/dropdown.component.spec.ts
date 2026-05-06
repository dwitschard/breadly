import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { DropdownComponent } from './dropdown.component';

const OPTIONS = [
  { value: 'min', label: 'Minuten' },
  { value: 'h', label: 'Stunden' },
];

describe('DropdownComponent', () => {
  async function setup(value: string | null = null) {
    return renderWithProviders(DropdownComponent, {
      componentInputs: { options: OPTIONS, value, placeholder: 'Einheit' },
    });
  }

  it('shows placeholder when no value selected', async () => {
    await setup();
    expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Einheit');
  });

  it('shows selected label', async () => {
    await setup('min');
    expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Minuten');
  });

  it('opens option list on click', async () => {
    const user = userEvent.setup();
    await setup();
    await user.click(screen.getByTestId('dropdown-trigger'));
    expect(screen.getByTestId('dropdown-list')).toBeInTheDocument();
  });

  it('emits valueChange when option selected', async () => {
    const user = userEvent.setup();
    const valueChange = vi.fn();
    await render(
      '<app-dropdown [options]="options" [value]="null" (valueChange)="valueChange($event)" />',
      {
        imports: [DropdownComponent, TranslateModule.forRoot()],
        componentProperties: { options: OPTIONS, valueChange },
      },
    );
    await user.click(screen.getByTestId('dropdown-trigger'));
    const optionEls = screen.getAllByTestId('dropdown-option');
    await user.click(optionEls[0]);
    expect(valueChange).toHaveBeenCalledWith('min');
  });

  it('is disabled when disabled input is true', async () => {
    await renderWithProviders(DropdownComponent, {
      componentInputs: { options: OPTIONS, value: null, disabled: true },
    });
    expect(screen.getByTestId('dropdown-trigger')).toBeDisabled();
  });
});
