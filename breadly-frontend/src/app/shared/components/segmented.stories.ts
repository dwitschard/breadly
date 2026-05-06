import type { Meta, StoryObj } from '@storybook/angular';
import { SegmentedComponent } from './segmented.component';

const meta: Meta<SegmentedComponent> = {
  title: 'Components/Segmented',
  component: SegmentedComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<SegmentedComponent>;

export const TwoSegments: Story = {
  args: {
    options: [{ value: 'aktiv', label: 'Aktiv' }, { value: 'warten', label: 'Warten' }],
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
    options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
    value: 'a',
    disabled: true,
  },
};
