import type { Meta, StoryObj } from '@storybook/angular';
import { SidebarComponent } from './sidebar.component';

const meta: Meta<SidebarComponent> = {
  title: 'Components/Sidebar',
  component: SidebarComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<SidebarComponent>;

export const Open: Story = {
  render: () => ({
    template: `
      <app-sidebar title="Filter" [open]="true">
        <p>Filterinhalt hier</p>
        <div slot="footer">
          <app-button variant="primary">Anwenden</app-button>
        </div>
      </app-sidebar>
    `,
  }),
};
export const Closed: Story = {
  render: () => ({
    template: `<app-sidebar title="Filter" [open]="false"></app-sidebar>`,
  }),
};
