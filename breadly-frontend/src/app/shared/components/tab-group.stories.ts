import type { Meta, StoryObj } from '@storybook/angular';
import { TabGroupComponent } from './tab-group.component';

const TABS = [
  { id: 'rezepte', label: 'Rezepte' },
  { id: 'profil', label: 'Profil' },
  { id: 'gesundheit', label: 'Gesundheit', disabled: true },
];

const meta: Meta<TabGroupComponent> = {
  title: 'Components/TabGroup',
  component: TabGroupComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<TabGroupComponent>;

export const Default: Story = {
  args: { tabs: TABS, activeTab: 'rezepte' },
};
export const SecondTabActive: Story = {
  args: { tabs: TABS, activeTab: 'profil' },
};
