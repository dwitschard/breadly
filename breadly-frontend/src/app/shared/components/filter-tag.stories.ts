import type { Meta, StoryObj } from '@storybook/angular';
import { FilterTagComponent } from './filter-tag.component';

const meta: Meta<FilterTagComponent> = {
  title: 'Components/FilterTag',
  component: FilterTagComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<FilterTagComponent>;

export const Inactive: Story = {
  render: () => ({ template: `<app-filter-tag [active]="false">Alle</app-filter-tag>` }),
};
export const Active: Story = {
  render: () => ({ template: `<app-filter-tag [active]="true">Alle</app-filter-tag>` }),
};
export const Disabled: Story = {
  render: () => ({ template: `<app-filter-tag [disabled]="true">Inaktiv</app-filter-tag>` }),
};
export const Group: Story = {
  render: () => ({
    template: `
      <div class="flex gap-2">
        <app-filter-tag [active]="true">Alle</app-filter-tag>
        <app-filter-tag [active]="false">Aktiv</app-filter-tag>
        <app-filter-tag [active]="false">Warten</app-filter-tag>
      </div>
    `,
  }),
};
