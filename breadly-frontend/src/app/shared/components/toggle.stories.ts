import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleComponent } from './toggle.component';

const meta: Meta<ToggleComponent> = {
  title: 'Components/Toggle',
  component: ToggleComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<ToggleComponent>;

export const Off: Story = {
  args: { on: false, label: 'Benachrichtigungen aktivieren', labelPosition: 'right' },
};
export const On: Story = {
  args: { on: true, label: 'Benachrichtigungen aktivieren', labelPosition: 'right' },
};
export const LabelLeft: Story = {
  args: { on: true, label: 'Benachrichtigungen', labelPosition: 'left' },
};
export const Disabled: Story = {
  args: { on: false, disabled: true, label: 'Deaktiviert' },
};
