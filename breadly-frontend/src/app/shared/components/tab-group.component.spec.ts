import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { TabGroupComponent } from './tab-group.component';

const TABS = [
  { id: 'rezepte', label: 'Rezepte' },
  { id: 'profil', label: 'Profil' },
  { id: 'gesundheit', label: 'Gesundheit', disabled: true },
];

describe('TabGroupComponent', () => {
  async function setup(activeTab = 'rezepte') {
    return renderWithProviders(TabGroupComponent, {
      componentInputs: { tabs: TABS, activeTab },
    });
  }

  it('renders all tabs', async () => {
    await setup();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('active tab has aria-selected true', async () => {
    await setup('profil');
    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('emits tabChange on tab click', async () => {
    const user = userEvent.setup();
    const tabChange = vi.fn();
    await render(
      '<app-tab-group [tabs]="tabs" activeTab="rezepte" (tabChange)="tabChange($event)" />',
      {
        imports: [TabGroupComponent, TranslateModule.forRoot()],
        componentProperties: { tabs: TABS, tabChange },
      },
    );
    await user.click(screen.getAllByRole('tab')[1]);
    expect(tabChange).toHaveBeenCalledWith('profil');
  });

  it('disabled tab does not emit', async () => {
    const user = userEvent.setup();
    const tabChange = vi.fn();
    await render(
      '<app-tab-group [tabs]="tabs" activeTab="rezepte" (tabChange)="tabChange($event)" />',
      {
        imports: [TabGroupComponent, TranslateModule.forRoot()],
        componentProperties: { tabs: TABS, tabChange },
      },
    );
    await user.click(screen.getAllByRole('tab')[2]);
    expect(tabChange).not.toHaveBeenCalled();
  });
});
