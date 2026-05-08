import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  it('renders label text', async () => {
    await renderWithProviders(CheckboxComponent, {
      componentInputs: { label: 'Akzeptieren', checked: false },
    });
    expect(screen.getByTestId('checkbox-label')).toHaveTextContent('Akzeptieren');
  });

  it('is checked when checked input is true', async () => {
    await renderWithProviders(CheckboxComponent, {
      componentInputs: { checked: true, label: 'Test' },
    });
    expect(screen.getByTestId('checkbox-input')).toBeChecked();
  });

  it('is disabled when disabled input is true', async () => {
    await renderWithProviders(CheckboxComponent, {
      componentInputs: { disabled: true, label: 'Test' },
    });
    expect(screen.getByTestId('checkbox-input')).toBeDisabled();
  });

  it('emits checkedChange on toggle', async () => {
    const user = userEvent.setup();
    const checkedChange = vi.fn();
    await render(
      '<app-checkbox label="Test" [checked]="false" (checkedChange)="checkedChange($event)" />',
      {
        imports: [CheckboxComponent, TranslateModule.forRoot()],
        componentProperties: { checkedChange },
      },
    );
    await user.click(screen.getByTestId('checkbox-label'));
    expect(checkedChange).toHaveBeenCalledWith(true);
  });
});
