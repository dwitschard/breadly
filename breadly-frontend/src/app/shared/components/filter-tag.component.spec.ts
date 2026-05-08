import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { screen, userEvent } from '../../../testing/render-with-providers';
import { FilterTagComponent } from './filter-tag.component';

describe('FilterTagComponent', () => {
  it('renders label', async () => {
    await render('<app-filter-tag>Alle</app-filter-tag>', {
      imports: [FilterTagComponent, TranslateModule.forRoot()],
    });
    expect(screen.getByRole('button')).toHaveTextContent('Alle');
  });

  it('aria-pressed reflects active state', async () => {
    await render('<app-filter-tag [active]="true">Alle</app-filter-tag>', {
      imports: [FilterTagComponent, TranslateModule.forRoot()],
    });
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('emits toggled with new state on click', async () => {
    const user = userEvent.setup();
    const toggled = vi.fn();
    await render(
      '<app-filter-tag [active]="false" (toggled)="toggled($event)">Alle</app-filter-tag>',
      {
        imports: [FilterTagComponent, TranslateModule.forRoot()],
        componentProperties: { toggled },
      },
    );
    await user.click(screen.getByRole('button'));
    expect(toggled).toHaveBeenCalledWith(true);
  });

  it('does not emit when disabled', async () => {
    const user = userEvent.setup();
    const toggled = vi.fn();
    await render(
      '<app-filter-tag [disabled]="true" (toggled)="toggled($event)">Alle</app-filter-tag>',
      {
        imports: [FilterTagComponent, TranslateModule.forRoot()],
        componentProperties: { toggled },
      },
    );
    await user.click(screen.getByRole('button'));
    expect(toggled).not.toHaveBeenCalled();
  });
});
