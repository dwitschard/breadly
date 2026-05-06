import type { Meta, StoryObj } from '@storybook/angular';
import { DropdownComponent } from './dropdown.component';
import description from './dropdown.docs.md';

const OPTIONS = [
  { value: 'min', label: 'Minuten' },
  { value: 'h', label: 'Stunden' },
  { value: 'd', label: 'Tage' },
];

const meta: Meta<DropdownComponent> = {
  title: 'Components/Dropdown',
  component: DropdownComponent,
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
      description: 'List of selectable options (required). Each option needs a value and label.',
      control: { type: 'object' },
      table: { type: { summary: 'DropdownOption[]' }, category: 'Inputs' },
    },
    value: {
      description: 'Currently selected option value. Pass null to show the placeholder.',
      control: { type: 'text' },
      table: { type: { summary: 'string | null' }, defaultValue: { summary: 'null' }, category: 'Inputs' },
    },
    placeholder: {
      description: 'Text shown when no option is selected.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Auswählen'" }, category: 'Inputs' },
    },
    disabled: {
      description: 'Prevents the dropdown from opening.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    error: {
      description: 'Highlights the trigger border in red and shows the helperText.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    helperText: {
      description: 'Validation message shown below the trigger when error is true.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    valueChange: {
      description: 'Emitted with the selected option value when the user picks an item.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<string>' } },
    },
  },
};
export default meta;
type Story = StoryObj<DropdownComponent>;

export const Default: Story = {
  args: { options: OPTIONS, value: null, placeholder: 'Einheit' },
};
export const Selected: Story = {
  args: { options: OPTIONS, value: 'min', placeholder: 'Einheit' },
};
export const Disabled: Story = {
  args: { options: OPTIONS, value: null, disabled: true },
};
export const WithError: Story = {
  args: { options: OPTIONS, value: null, error: true, helperText: 'Bitte wählen' },
};
