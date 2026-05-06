import type { Meta, StoryObj } from '@storybook/angular';
import { RadioComponent } from './radio.component';

const meta: Meta<RadioComponent> = {
  title: 'Components/Radio',
  component: RadioComponent,
  tags: ['autodocs'],
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
