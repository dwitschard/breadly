import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleComponent } from './toggle.component';
import description from './toggle.docs.md';

const meta: Meta<ToggleComponent> = {
  title: 'Components/Toggle',
  component: ToggleComponent,
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
    on: {
      description: 'Whether the toggle is in the on state.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    disabled: {
      description: 'Prevents interaction and dims the control.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    label: {
      description: 'Accessible label text shown beside the track.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    labelPosition: {
      description: 'Which side of the track the label appears on.',
      control: { type: 'select' },
      options: ['left', 'right'],
      table: { type: { summary: "'left' | 'right'" }, defaultValue: { summary: "'right'" }, category: 'Inputs' },
    },
    toggled: {
      description: 'Emitted with the new on/off value when the user clicks the toggle.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<boolean>' } },
    },
  },
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
export const Interactive: Story = {
  render: () => ({
    props: { on: false },
    template: `<app-toggle [on]="on" label="Benachrichtigungen" (toggled)="on = $event" />`,
  }),
};
