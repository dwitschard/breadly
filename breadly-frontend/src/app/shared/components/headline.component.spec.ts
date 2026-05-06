import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it } from 'vitest';
import { screen } from '../../../testing/render-with-providers';
import { HeadlineComponent } from './headline.component';

function renderHeadline(template: string) {
  return render(template, { imports: [HeadlineComponent, TranslateModule.forRoot()] });
}

describe('HeadlineComponent', () => {
  it('renders projected content', async () => {
    await renderHeadline('<app-headline>Hello</app-headline>');
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('has heading role for h1 level', async () => {
    await renderHeadline('<app-headline level="h1">Title</app-headline>');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('has heading role for h2 level', async () => {
    await renderHeadline('<app-headline level="h2">Section</app-headline>');
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('has no heading role for body level', async () => {
    await renderHeadline('<app-headline level="body">Body text</app-headline>');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
