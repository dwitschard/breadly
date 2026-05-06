import type { Meta, StoryObj } from '@storybook/angular';
import { LucideBell } from '@lucide/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Components/Badge',
  component: BadgeComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<BadgeComponent>;

export const Default: Story = { args: { icon: LucideBell, count: null } };
export const WithCount: Story = { args: { icon: LucideBell, count: 3 } };
export const HighCount: Story = { args: { icon: LucideBell, count: 150 } };
