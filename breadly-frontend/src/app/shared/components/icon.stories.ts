import type { Meta, StoryObj } from '@storybook/angular';
import { LucideBell, LucideCheck, LucidePlus, LucideTrash2, LucideX } from '@lucide/angular';
import { IconComponent } from './icon.component';

const meta: Meta<IconComponent> = {
  title: 'Components/Icon',
  component: IconComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<IconComponent>;

export const Bell16: Story = { args: { icon: LucideBell, size: 16, strokeWidth: 1.5 } };
export const Plus24: Story = { args: { icon: LucidePlus, size: 24, strokeWidth: 1.5 } };
export const Trash36: Story = { args: { icon: LucideTrash2, size: 36, strokeWidth: 1.5 } };

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
