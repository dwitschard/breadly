import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxComponent } from './checkbox.component';

const meta: Meta<CheckboxComponent> = {
  title: 'Components/Checkbox',
  component: CheckboxComponent,
  tags: ['autodocs'],
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
