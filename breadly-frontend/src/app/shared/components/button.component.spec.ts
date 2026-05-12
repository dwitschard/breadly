import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('renders label text', async () => {
    await render('<app-button>Klick</app-button>', {
      imports: [ButtonComponent, TranslateModule.forRoot()],
    });
    expect(screen.getByRole('button', { name: /Klick/ })).toBeInTheDocument();
  });

  it('is disabled when disabled input is true', async () => {
    await render('<app-button [disabled]="true">Klick</app-button>', {
      imports: [ButtonComponent, TranslateModule.forRoot()],
    });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading', async () => {
    await render('<app-button [loading]="true">Klick</app-button>', {
      imports: [ButtonComponent, TranslateModule.forRoot()],
    });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows spinner when loading', async () => {
    await render('<app-button [loading]="true">Klick</app-button>', {
      imports: [ButtonComponent, TranslateModule.forRoot()],
    });
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });

  it('emits clicked on click', async () => {
    const user = userEvent.setup();
    const clicked = vi.fn();
    await render('<app-button (clicked)="clicked()">Klick</app-button>', {
      imports: [ButtonComponent, TranslateModule.forRoot()],
      componentProperties: { clicked },
    });
    await user.click(screen.getByRole('button'));
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('applies primary variant classes', async () => {
    await renderWithProviders(ButtonComponent, {
      componentInputs: { variant: 'primary' },
    });
    expect(screen.getByTestId('button').className).toContain('bg-brand');
  });

  it('applies h-full and py-1.5 instead of h-control when stretch is true', async () => {
    await renderWithProviders(ButtonComponent, {
      componentInputs: { stretch: true },
    });
    const btn = screen.getByTestId('button');
    expect(btn.className).toContain('h-full');
    expect(btn.className).toContain('py-1.5');
    expect(btn.className).not.toContain('h-control');
  });
});
