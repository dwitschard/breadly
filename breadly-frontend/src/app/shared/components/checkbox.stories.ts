import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxComponent } from './checkbox.component';
import description from './checkbox.docs.md';

const meta: Meta<CheckboxComponent> = {
  title: 'Components/Checkbox',
  component: CheckboxComponent,
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
    checked: {
      description: 'Whether the checkbox is checked.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    indeterminate: {
      description: 'Shows a dash instead of a tick — use when a parent checkbox has a mix of checked/unchecked children.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    disabled: {
      description: 'Prevents interaction and dims the control.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    error: {
      description: 'Marks the field as invalid. Shows helperText below after the user interacts.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    label: {
      description: 'Text label rendered next to the checkbox.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    helperText: {
      description: 'Validation message shown below when error is true and the field has been touched.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    checkedChange: {
      description: 'Emitted with the new checked value when the user clicks the checkbox.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<boolean>' } },
    },
  },
};
export default meta;
type Story = StoryObj<CheckboxComponent>;

export const Unchecked: Story = {
  args: { checked: false, label: 'Schritt als aktiv markieren' },
};
export const Checked: Story = {
  args: { checked: true, label: 'Schritt als aktiv markieren' },
};
export const Indeterminate: Story = {
  args: { indeterminate: true, label: 'Alle auswählen' },
};
export const Disabled: Story = {
  args: { disabled: true, checked: false, label: 'Nicht verfügbar' },
};
export const WithError: Story = {
  args: { error: true, label: 'Pflichtfeld', helperText: 'Pflichtfeld' },
};
