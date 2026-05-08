import type { Meta, StoryObj } from '@storybook/angular';
import { SegmentedComponent } from './segmented.component';
import description from './segmented.docs.md';

const meta: Meta<SegmentedComponent> = {
  title: 'Components/Segmented',
  component: SegmentedComponent,
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
      description: 'List of segments to render (required). Each segment needs a value and label.',
      control: { type: 'object' },
      table: { type: { summary: 'SegmentedOption[]' }, category: 'Inputs' },
    },
    value: {
      description: 'Currently active segment value (required).',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, category: 'Inputs' },
    },
    disabled: {
      description: 'Prevents all interaction and dims the control.',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Inputs',
      },
    },
    valueChange: {
      description: 'Emitted with the newly selected value when the user clicks a segment.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<string>' } },
    },
  },
};
export default meta;
type Story = StoryObj<SegmentedComponent>;

export const TwoSegments: Story = {
  args: {
    options: [
      { value: 'aktiv', label: 'Aktiv' },
      { value: 'warten', label: 'Warten' },
    ],
    value: 'aktiv',
  },
};
export const ThreeSegments: Story = {
  args: {
    options: [
      { value: 'tag', label: 'Tag' },
      { value: 'woche', label: 'Woche' },
      { value: 'monat', label: 'Monat' },
    ],
    value: 'woche',
  },
};
export const Disabled: Story = {
  args: {
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
    value: 'a',
    disabled: true,
  },
};
