import type { Meta, StoryObj } from '@storybook/angular';
import { SliderComponent } from './slider.component';
import description from './slider.docs.md';

const meta: Meta<SliderComponent> = {
  title: 'Components/Slider',
  component: SliderComponent,
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
    min: {
      description: 'Minimum value of the range.',
      control: { type: 'number' },
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' }, category: 'Inputs' },
    },
    max: {
      description: 'Maximum value of the range.',
      control: { type: 'number' },
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' }, category: 'Inputs' },
    },
    step: {
      description: 'Step increment between selectable values.',
      control: { type: 'number' },
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' }, category: 'Inputs' },
    },
    value: {
      description: 'Current slider position.',
      control: { type: 'number' },
      table: { type: { summary: 'number' }, defaultValue: { summary: '50' }, category: 'Inputs' },
    },
    disabled: {
      description: 'Prevents interaction and dims the track.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    label: {
      description: 'Label shown above the track alongside the current value.',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Inputs' },
    },
    valueChange: {
      description: 'Emitted with the new numeric value as the user drags the thumb.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<number>' } },
    },
  },
};
export default meta;
type Story = StoryObj<SliderComponent>;

export const Default: Story = {
  args: { min: 0, max: 100, value: 50, label: 'Hydration' },
};
export const AtMax: Story = {
  args: { min: 0, max: 100, value: 75, label: 'Hydration' },
};
export const Disabled: Story = {
  args: { min: 0, max: 100, value: 50, disabled: true, label: 'Deaktiviert' },
};
