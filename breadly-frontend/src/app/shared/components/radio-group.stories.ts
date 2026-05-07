import type { Meta, StoryObj } from '@storybook/angular';
import { RadioGroupComponent } from './radio-group.component';
import description from './radio-group.docs.md';

const OPTIONS = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'warten', label: 'Warten' },
  { value: 'pause', label: 'Pause', disabled: true },
];

const meta: Meta<RadioGroupComponent> = {
  title: 'Components/RadioGroup',
  component: RadioGroupComponent,
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
    options: {
      description:
        'Array of options to render (required). Each option has value, label, and optional disabled flag.',
      control: { type: 'object' },
      table: { type: { summary: 'RadioOption[]' }, category: 'Inputs' },
    },
    value: {
      description: 'Currently selected option value.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    label: {
      description: 'Group label rendered above the radios.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    error: {
      description: 'Marks all radios as invalid and shows the helperText.',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Inputs',
      },
    },
    helperText: {
      description: 'Validation message shown below the group when error is true.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    groupId: {
      description: 'ID prefix used for the aria-labelledby association.',
      control: { type: 'text' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'radio-group'" },
        category: 'Inputs',
      },
    },
    valueChange: {
      description: 'Emitted with the newly selected value when the user clicks a radio.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<string>' } },
    },
  },
};
export default meta;
type Story = StoryObj<RadioGroupComponent>;

export const Default: Story = {
  args: { options: OPTIONS, value: 'aktiv', label: 'Schritttyp' },
};
export const WithError: Story = {
  args: {
    options: OPTIONS,
    value: '',
    label: 'Schritttyp',
    error: true,
    helperText: 'Pflichtfeld',
  },
};
