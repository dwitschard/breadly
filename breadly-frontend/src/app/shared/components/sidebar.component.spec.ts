import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  it('renders title when open', async () => {
    await renderWithProviders(SidebarComponent, {
      componentInputs: { title: 'Filter', open: true },
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByTestId('sidebar-title')).toHaveTextContent('Filter');
  });

  it('does not render panel when closed', async () => {
    await renderWithProviders(SidebarComponent, {
      componentInputs: { title: 'Filter', open: false },
    });
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('emits dismissed when close button clicked', async () => {
    const user = userEvent.setup();
    const dismissed = vi.fn();
    await render(
      '<app-sidebar title="Filter" [open]="true" (dismissed)="dismissed()"></app-sidebar>',
      {
        imports: [SidebarComponent, TranslateModule.forRoot()],
        componentProperties: { dismissed },
      },
    );
    await new Promise((r) => setTimeout(r, 10));
    await user.click(screen.getByTestId('sidebar-close'));
    expect(dismissed).toHaveBeenCalledOnce();
  });

  it('emits dismissed when scrim clicked', async () => {
    const user = userEvent.setup();
    const dismissed = vi.fn();
    await render(
      '<app-sidebar title="Filter" [open]="true" (dismissed)="dismissed()"></app-sidebar>',
      {
        imports: [SidebarComponent, TranslateModule.forRoot()],
        componentProperties: { dismissed },
      },
    );
    await new Promise((r) => setTimeout(r, 10));
    await user.click(screen.getByTestId('sidebar-scrim'));
    expect(dismissed).toHaveBeenCalledOnce();
  });
});
