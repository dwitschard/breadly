import type { Meta, StoryObj } from '@storybook/angular';
import { FilterTagComponent } from './filter-tag.component';
import description from './filter-tag.docs.md';

const meta: Meta<FilterTagComponent> = {
  title: 'Components/FilterTag',
  component: FilterTagComponent,
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
    active: {
      description: 'Whether the filter is currently applied (highlighted amber style).',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    disabled: {
      description: 'Prevents toggling and dims the pill.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    toggled: {
      description: 'Emitted with the new active value when the user clicks the tag.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<boolean>' } },
    },
  },
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
