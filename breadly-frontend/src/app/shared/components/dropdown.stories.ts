import type { Meta, StoryObj } from '@storybook/angular';
import { DropdownComponent } from './dropdown.component';

const OPTIONS = [
  { value: 'min', label: 'Minuten' },
  { value: 'h', label: 'Stunden' },
  { value: 'd', label: 'Tage' },
];

const meta: Meta<DropdownComponent> = {
  title: 'Components/Dropdown',
  component: DropdownComponent,
  tags: ['autodocs'],
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
