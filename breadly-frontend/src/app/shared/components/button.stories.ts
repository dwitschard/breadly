import type { Meta, StoryObj } from '@storybook/angular';
import { LucidePlus } from '@lucide/angular';
import { ButtonComponent } from './button.component';
import description from './button.docs.md';

const meta: Meta<ButtonComponent> = {
  title: 'Components/Button',
  component: ButtonComponent,
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
      description: 'Visual style of the button.',
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
      table: { type: { summary: "'primary' | 'secondary' | 'ghost'" }, defaultValue: { summary: "'primary'" }, category: 'Inputs' },
    },
    disabled: {
      description: 'Prevents interaction and dims the button.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    loading: {
      description: 'Replaces content with a spinner and disables the button.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    type: {
      description: 'HTML button type attribute.',
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      table: { type: { summary: "'button' | 'submit' | 'reset'" }, defaultValue: { summary: "'button'" }, category: 'Inputs' },
    },
    icon: {
      description: 'Lucide icon component to render before the label.',
      control: false,
      table: { type: { summary: 'Type<unknown> | null' }, defaultValue: { summary: 'null' }, category: 'Inputs' },
    },
    clicked: {
      description: 'Emitted on button click (when not disabled or loading).',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  render: () => ({ template: `<app-button variant="primary">Rezept erstellen</app-button>` }),
};
export const PrimaryWithIcon: Story = {
  render: () => ({ template: `<app-button variant="primary" [icon]="LucidePlus">Rezept erstellen</app-button>`, props: { LucidePlus } }),
};
export const Secondary: Story = {
  render: () => ({ template: `<app-button variant="secondary">Abbrechen</app-button>` }),
};
export const Ghost: Story = {
  render: () => ({ template: `<app-button variant="ghost">Mehr anzeigen</app-button>` }),
};
export const Loading: Story = {
  render: () => ({ template: `<app-button [loading]="true">Speichern</app-button>` }),
};
export const Disabled: Story = {
  render: () => ({ template: `<app-button [disabled]="true">Nicht verfügbar</app-button>` }),
};
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3">
        <app-button variant="primary">Primär</app-button>
        <app-button variant="secondary">Sekundär</app-button>
        <app-button variant="ghost">Ghost</app-button>
        <app-button [loading]="true">Laden</app-button>
        <app-button [disabled]="true">Deaktiviert</app-button>
      </div>
    `,
  }),
};
