import type { Meta, StoryObj } from '@storybook/angular';
import { HeadlineComponent } from './headline.component';

const meta: Meta<HeadlineComponent> = {
  title: 'Components/Headline',
  component: HeadlineComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<HeadlineComponent>;

export const Display: Story = {
  args: { level: 'display' },
  render: (args) => ({ props: args, template: `<app-headline level="display">Meine Rezepte</app-headline>` }),
};
export const H1: Story = {
  render: () => ({ template: `<app-headline level="h1">Meine Rezepte</app-headline>` }),
};
export const H2: Story = {
  render: () => ({ template: `<app-headline level="h2">Zutaten</app-headline>` }),
};
export const H3: Story = {
  render: () => ({ template: `<app-headline level="h3">Schritte</app-headline>` }),
};
export const H4: Story = {
  render: () => ({ template: `<app-headline level="h4">Hinweise</app-headline>` }),
};
export const Body: Story = {
  render: () => ({ template: `<app-headline level="body">Beschreibungstext</app-headline>` }),
};
export const Muted: Story = {
  render: () => ({ template: `<app-headline level="muted">Sekundärer Text</app-headline>` }),
};
export const Caption: Story = {
  render: () => ({ template: `<app-headline level="caption">Metadaten · 12px</app-headline>` }),
};
