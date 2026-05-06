import type { Meta, StoryObj } from '@storybook/angular';
import { DialogComponent } from './dialog.component';

const meta: Meta<DialogComponent> = {
  title: 'Components/Dialog',
  component: DialogComponent,
  tags: ['autodocs'],
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
