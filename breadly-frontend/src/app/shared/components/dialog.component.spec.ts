import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });
  });

  it('renders title when open', async () => {
    await renderWithProviders(DialogComponent, {
      componentInputs: { title: 'Rezept löschen?', open: true },
    });
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Rezept löschen?');
  });

  it('emits cancel when X button clicked', async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    await render(
      '<app-dialog title="Test" [open]="true" (cancel)="cancel()"><span slot="confirm">OK</span></app-dialog>',
      {
        imports: [DialogComponent, TranslateModule.forRoot()],
        componentProperties: { cancel },
      },
    );
    // The X close button is a native <button> with data-testid="dialog-close"
    await user.click(screen.getByTestId('dialog-close'));
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('emits confirm when confirm button clicked', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    await render(
      '<app-dialog title="Test" [open]="true" (confirm)="confirm()"><span slot="confirm">Bestätigen</span></app-dialog>',
      {
        imports: [DialogComponent, TranslateModule.forRoot()],
        componentProperties: { confirm },
      },
    );
    // Click the actual inner <button> by its accessible name
    await user.click(screen.getByRole('button', { name: /Bestätigen/i }));
    expect(confirm).toHaveBeenCalledOnce();
  });

  it('shows spinner when loading', async () => {
    await renderWithProviders(DialogComponent, {
      componentInputs: { title: 'Test', open: true, loading: true },
    });
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
