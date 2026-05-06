import type { Meta, StoryObj } from '@storybook/angular';
import { SidebarComponent } from './sidebar.component';
import { ButtonComponent } from './button.component';
import description from './sidebar.docs.md';

const meta: Meta<SidebarComponent> = {
  title: 'Components/Sidebar',
  component: SidebarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    title: {
      description: 'Panel heading text (required).',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, category: 'Inputs' },
    },
    open: {
      description: 'Controls whether the panel is visible. Triggers the slide-in animation.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    dismissed: {
      description: 'Emitted when the user clicks the scrim or the × button.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<SidebarComponent>;

export const Open: Story = {
  render: () => ({
    moduleMetadata: { imports: [ButtonComponent] },
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
