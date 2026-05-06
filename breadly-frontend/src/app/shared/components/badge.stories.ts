import type { Meta, StoryObj } from '@storybook/angular';
import { LucideBell } from '@lucide/angular';
import { BadgeComponent } from './badge.component';
import description from './badge.docs.md';

const meta: Meta<BadgeComponent> = {
  title: 'Components/Badge',
  component: BadgeComponent,
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
    icon: {
      description: 'Lucide icon component to render (required).',
      control: false,
      table: { type: { summary: 'Type<unknown>' }, category: 'Inputs' },
    },
    count: {
      description: 'Notification count. Displays "99+" for values above 99. Omit or pass null to hide the badge.',
      control: { type: 'number' },
      table: { type: { summary: 'number | null' }, defaultValue: { summary: 'null' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<BadgeComponent>;

export const Default: Story = {
  render: () => ({ template: `<app-badge [icon]="LucideBell" />`, props: { LucideBell } }),
};
export const WithCount: Story = {
  render: () => ({ template: `<app-badge [icon]="LucideBell" [count]="3" />`, props: { LucideBell } }),
};
export const HighCount: Story = {
  render: () => ({ template: `<app-badge [icon]="LucideBell" [count]="150" />`, props: { LucideBell } }),
};
