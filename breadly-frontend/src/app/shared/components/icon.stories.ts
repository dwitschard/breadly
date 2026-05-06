import type { Meta, StoryObj } from '@storybook/angular';
import { LucideBell, LucideCheck, LucidePlus, LucideTrash2, LucideX } from '@lucide/angular';
import { IconComponent } from './icon.component';
import description from './icon.docs.md';

const meta: Meta<IconComponent> = {
  title: 'Components/Icon',
  component: IconComponent,
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
      description: 'Lucide icon component class to render (required).',
      control: false,
      table: { type: { summary: 'Type<unknown>' }, category: 'Inputs' },
    },
    size: {
      description: 'Icon width and height in pixels.',
      control: { type: 'number' },
      table: { type: { summary: 'number' }, defaultValue: { summary: '24' }, category: 'Inputs' },
    },
    strokeWidth: {
      description: 'SVG stroke width passed to the Lucide icon.',
      control: { type: 'number' },
      table: { type: { summary: 'number' }, defaultValue: { summary: '1.5' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<IconComponent>;

export const Bell16: Story = {
  render: () => ({ template: `<app-icon [icon]="LucideBell" [size]="16" [strokeWidth]="1.5" />`, props: { LucideBell } }),
};
export const Plus24: Story = {
  render: () => ({ template: `<app-icon [icon]="LucidePlus" [size]="24" [strokeWidth]="1.5" />`, props: { LucidePlus } }),
};
export const Trash36: Story = {
  render: () => ({ template: `<app-icon [icon]="LucideTrash2" [size]="36" [strokeWidth]="1.5" />`, props: { LucideTrash2 } }),
};

export const AllIcons: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex flex-col items-center gap-1">
          <app-icon [icon]="LucideBell" [size]="24" />
          <span class="text-xs text-warm-500">Bell</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <app-icon [icon]="LucidePlus" [size]="24" />
          <span class="text-xs text-warm-500">Plus</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <app-icon [icon]="LucideTrash2" [size]="24" />
          <span class="text-xs text-warm-500">Trash</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <app-icon [icon]="LucideCheck" [size]="24" />
          <span class="text-xs text-warm-500">Check</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <app-icon [icon]="LucideX" [size]="24" />
          <span class="text-xs text-warm-500">X</span>
        </div>
      </div>
    `,
    props: { LucideBell, LucidePlus, LucideTrash2, LucideCheck, LucideX },
  }),
};
