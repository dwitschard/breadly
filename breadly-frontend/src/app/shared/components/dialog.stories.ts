import type { Meta, StoryObj } from '@storybook/angular';
import { DialogComponent } from './dialog.component';
import description from './dialog.docs.md';

const meta: Meta<DialogComponent> = {
  title: 'Components/Dialog',
  component: DialogComponent,
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
      description: 'Dialog heading text (required).',
      control: { type: 'text' },
      table: { type: { summary: 'string' }, category: 'Inputs' },
    },
    open: {
      description: 'Whether the native <dialog> is shown as a modal.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    loading: {
      description: 'Replaces the body slot with a centred spinner and disables the footer actions.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    destructive: {
      description: 'Shows a warning icon in the header and renders the confirm button in red.',
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Inputs' },
    },
    confirm: {
      description: 'Emitted when the user clicks the confirm button.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<void>' } },
    },
    cancel: {
      description: 'Emitted when the user clicks the cancel button or the × icon.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<void>' } },
    },
    dismissed: {
      description: 'Emitted when the user clicks the backdrop or presses Escape.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<DialogComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <app-dialog title="Rezept löschen?" [open]="true">
        Diese Aktion kann nicht rückgängig gemacht werden.
        <span slot="confirm">Bestätigen</span>
      </app-dialog>
    `,
  }),
};
export const Destructive: Story = {
  render: () => ({
    template: `
      <app-dialog title="Rezept löschen?" [open]="true" [destructive]="true">
        Diese Aktion kann nicht rückgängig gemacht werden.
        <span slot="confirm">Löschen</span>
      </app-dialog>
    `,
  }),
};
export const Loading: Story = {
  render: () => ({
    template: `
      <app-dialog title="Wird gelöscht…" [open]="true" [loading]="true">
        <span slot="confirm">Löschen</span>
      </app-dialog>
    `,
  }),
};
