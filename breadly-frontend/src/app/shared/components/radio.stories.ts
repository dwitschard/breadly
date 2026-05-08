import type { Meta, StoryObj } from '@storybook/angular';
import { RadioComponent } from './radio.component';
import description from './radio.docs.md';

const meta: Meta<RadioComponent> = {
  title: 'Components/Radio',
  component: RadioComponent,
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
    value: {
      description: 'The string value emitted when this radio is selected (required).',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, category: 'Inputs' },
    },
    checked: {
      description: 'Whether this radio is currently selected.',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Inputs',
      },
    },
    disabled: {
      description: 'Prevents selection and dims the control.',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Inputs',
      },
    },
    error: {
      description: 'Highlights the circle border in red.',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Inputs',
      },
    },
    label: {
      description: 'Text label rendered next to the radio circle.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    selected: {
      description: 'Emitted with the radio value when the user selects it.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<string>' } },
    },
  },
};
export default meta;
type Story = StoryObj<RadioComponent>;

export const Unselected: Story = {
  args: { value: 'aktiv', checked: false, label: 'Aktiv' },
};
export const Selected: Story = {
  args: { value: 'aktiv', checked: true, label: 'Aktiv' },
};
export const Disabled: Story = {
  args: { value: 'aktiv', disabled: true, label: 'Nicht verfügbar' },
};
export const WithError: Story = {
  args: { value: 'aktiv', error: true, label: 'Pflichtfeld' },
};
