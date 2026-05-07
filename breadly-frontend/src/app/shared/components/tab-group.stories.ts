import type { Meta, StoryObj } from '@storybook/angular';
import { TabGroupComponent } from './tab-group.component';
import description from './tab-group.docs.md';

const TABS = [
  { id: 'rezepte', label: 'Rezepte' },
  { id: 'profil', label: 'Profil' },
  { id: 'gesundheit', label: 'Gesundheit', disabled: true },
];

const meta: Meta<TabGroupComponent> = {
  title: 'Components/TabGroup',
  component: TabGroupComponent,
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
    tabs: {
      description:
        'Array of tab definitions (required). Each tab needs an id, label, and optional disabled flag.',
      control: { type: 'object' },
      table: { type: { summary: 'TabItem[]' }, category: 'Inputs' },
    },
    activeTab: {
      description: 'ID of the currently active tab (required).',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, category: 'Inputs' },
    },
    tabChange: {
      description: 'Emitted with the clicked tab ID when the user switches tabs.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<string>' } },
    },
  },
};
export default meta;
type Story = StoryObj<TabGroupComponent>;

export const Default: Story = {
  args: { tabs: TABS, activeTab: 'rezepte' },
};
export const SecondTabActive: Story = {
  args: { tabs: TABS, activeTab: 'profil' },
};
