import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { ToggleComponent } from './toggle.component';

describe('ToggleComponent', () => {
  it('renders with switch role', async () => {
    await renderWithProviders(ToggleComponent, {
      componentInputs: { on: false, label: 'Benachrichtigungen' },
    });
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('aria-checked is false when off', async () => {
    await renderWithProviders(ToggleComponent, {
      componentInputs: { on: false },
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('aria-checked is true when on', async () => {
    await renderWithProviders(ToggleComponent, {
      componentInputs: { on: true },
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('emits toggled on click', async () => {
    const user = userEvent.setup();
    const toggled = vi.fn();
    await render('<app-toggle [on]="false" (toggled)="toggled($event)" />', {
      imports: [ToggleComponent, TranslateModule.forRoot()],
      componentProperties: { toggled },
    });
    await user.click(screen.getByRole('switch'));
    expect(toggled).toHaveBeenCalledWith(true);
  });

  it('does not emit when disabled', async () => {
    const user = userEvent.setup();
    const toggled = vi.fn();
    await render('<app-toggle [on]="false" [disabled]="true" (toggled)="toggled($event)" />', {
      imports: [ToggleComponent, TranslateModule.forRoot()],
      componentProperties: { toggled },
    });
    await user.click(screen.getByRole('switch'));
    expect(toggled).not.toHaveBeenCalled();
  });
});
