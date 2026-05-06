import type { Meta, StoryObj } from '@storybook/angular';
import { LucidePlus } from '@lucide/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Components/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  render: () => ({ template: `<app-button variant="primary">Rezept erstellen</app-button>` }),
};
export const PrimaryWithIcon: Story = {
  render: () => ({ template: `<app-button variant="primary" [icon]="LucidePlus">Rezept erstellen</app-button>`, props: { LucidePlus } }),
};
export const Secondary: Story = {
  render: () => ({ template: `<app-button variant="secondary">Abbrechen</app-button>` }),
};
export const Ghost: Story = {
  render: () => ({ template: `<app-button variant="ghost">Mehr anzeigen</app-button>` }),
};
export const Loading: Story = {
  render: () => ({ template: `<app-button [loading]="true">Speichern</app-button>` }),
};
export const Disabled: Story = {
  render: () => ({ template: `<app-button [disabled]="true">Nicht verfügbar</app-button>` }),
};
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3">
        <app-button variant="primary">Primär</app-button>
        <app-button variant="secondary">Sekundär</app-button>
        <app-button variant="ghost">Ghost</app-button>
        <app-button [loading]="true">Laden</app-button>
        <app-button [disabled]="true">Deaktiviert</app-button>
      </div>
    `,
  }),
};
