import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it } from 'vitest';
import { screen } from '../../../testing/render-with-providers';
import { TagComponent } from './tag.component';

function renderTag(template: string) {
  return render(template, { imports: [TagComponent, TranslateModule.forRoot()] });
}

describe('TagComponent', () => {
  it('renders projected label', async () => {
    await renderTag('<app-tag>Verifiziert</app-tag>');
    expect(screen.getByText('Verifiziert')).toBeInTheDocument();
  });

  it('shows dot when dot input is true', async () => {
    await renderTag('<app-tag [dot]="true">Label</app-tag>');
    expect(screen.getByTestId('tag-dot')).toBeInTheDocument();
  });

  it('hides dot by default', async () => {
    await renderTag('<app-tag>Label</app-tag>');
    expect(screen.queryByTestId('tag-dot')).not.toBeInTheDocument();
  });

  it('applies success classes for success variant', async () => {
    await renderTag('<app-tag variant="success">OK</app-tag>');
    const tag = screen.getByTestId('tag');
    expect(tag.className).toContain('bg-green-100');
  });
});
