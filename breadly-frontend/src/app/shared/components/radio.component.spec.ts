import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { RadioComponent } from './radio.component';

describe('RadioComponent', () => {
  it('renders label', async () => {
    await renderWithProviders(RadioComponent, {
      componentInputs: { value: 'a', label: 'Option A', checked: false },
    });
    expect(screen.getByTestId('radio-label')).toHaveTextContent('Option A');
  });

  it('is checked when checked input is true', async () => {
    await renderWithProviders(RadioComponent, {
      componentInputs: { value: 'a', checked: true },
    });
    expect(screen.getByTestId('radio-input')).toBeChecked();
  });

  it('is disabled when disabled input is true', async () => {
    await renderWithProviders(RadioComponent, {
      componentInputs: { value: 'a', disabled: true },
    });
    expect(screen.getByTestId('radio-input')).toBeDisabled();
  });

  it('applies border-warning class when warning', async () => {
    await renderWithProviders(RadioComponent, {
      componentInputs: { value: 'a', warning: true },
    });
    const circle = screen.getByTestId('radio-label').querySelector('[aria-hidden]');
    expect(circle!.className).toContain('border-warning');
  });

  it('emits selected with value on click', async () => {
    const user = userEvent.setup();
    const selected = vi.fn();
    await render('<app-radio value="opt1" label="Option" (selected)="selected($event)" />', {
      imports: [RadioComponent, TranslateModule.forRoot()],
      componentProperties: { selected },
    });
    await user.click(screen.getByTestId('radio-label'));
    expect(selected).toHaveBeenCalledWith('opt1');
  });
});
