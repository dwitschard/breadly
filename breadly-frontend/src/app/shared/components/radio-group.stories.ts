import type { Meta, StoryObj } from '@storybook/angular';
import { RadioGroupComponent } from './radio-group.component';

const OPTIONS = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'warten', label: 'Warten' },
  { value: 'pause', label: 'Pause', disabled: true },
];

const meta: Meta<RadioGroupComponent> = {
  title: 'Components/RadioGroup',
  component: RadioGroupComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<RadioGroupComponent>;

export const Default: Story = {
  args: { options: OPTIONS, value: 'aktiv', label: 'Schritttyp' },
};
export const WithError: Story = {
  args: { options: OPTIONS, value: '', label: 'Schritttyp', error: true, helperText: 'Pflichtfeld' },
};
