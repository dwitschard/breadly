import type { Meta, StoryObj } from '@storybook/angular';
import { TagComponent } from './tag.component';
import description from './tag.docs.md';

const meta: Meta<TagComponent> = {
  title: 'Components/Tag',
  component: TagComponent,
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
    variant: {
      description: 'Colour theme of the tag.',
      control: { type: 'select' },
      options: ['success', 'danger', 'neutral', 'info', 'disabled'],
      table: {
        type: { summary: "'success' | 'danger' | 'neutral' | 'info' | 'disabled'" },
        defaultValue: { summary: "'neutral'" },
        category: 'Inputs',
      },
    },
    dot: {
      description: 'Renders a small coloured dot before the label text.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<TagComponent>;

export const Success: Story = {
  render: () => ({ template: `<app-tag variant="success" [dot]="true">Verifiziert</app-tag>` }),
};
export const Danger: Story = {
  render: () => ({ template: `<app-tag variant="danger" [dot]="true">Fehler</app-tag>` }),
};
export const Neutral: Story = {
  render: () => ({ template: `<app-tag variant="neutral">Entwurf</app-tag>` }),
};
export const Info: Story = {
  render: () => ({ template: `<app-tag variant="info">Information</app-tag>` }),
};
export const Disabled: Story = {
  render: () => ({ template: `<app-tag variant="disabled">Inaktiv</app-tag>` }),
};
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-2">
        <app-tag variant="success" [dot]="true">Verifiziert</app-tag>
        <app-tag variant="danger" [dot]="true">Fehler</app-tag>
        <app-tag variant="neutral">Entwurf</app-tag>
        <app-tag variant="info">Information</app-tag>
        <app-tag variant="disabled">Inaktiv</app-tag>
      </div>
    `,
  }),
};
