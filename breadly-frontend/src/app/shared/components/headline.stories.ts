import type { Meta, StoryObj } from '@storybook/angular';
import { HeadlineComponent } from './headline.component';
import description from './headline.docs.md';

const meta: Meta<HeadlineComponent> = {
  title: 'Components/Headline',
  component: HeadlineComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    level: {
      description: 'Typography style and semantic heading level.',
      control: { type: 'select' },
      options: ['display', 'h1', 'h2', 'h3', 'h4', 'body', 'muted', 'caption'],
      table: {
        type: { summary: "'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'muted' | 'caption'" },
        defaultValue: { summary: "'body'" },
        category: 'Inputs',
      },
    },
  },
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
