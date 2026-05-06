import type { Meta, StoryObj } from '@storybook/angular';
import { SpinnerComponent } from './spinner.component';
import description from './spinner.docs.md';

const meta: Meta<SpinnerComponent> = {
  title: 'Components/Spinner',
  component: SpinnerComponent,
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
    size: {
      description: 'Controls the diameter and border width of the spinner.',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      table: {
        type: { summary: "'sm' | 'md' | 'lg'" },
        defaultValue: { summary: "'md'" },
        category: 'Inputs',
      },
    },
  },
};
export default meta;
type Story = StoryObj<SpinnerComponent>;

export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Large: Story = { args: { size: 'lg' } };
