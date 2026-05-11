import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tab-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="tablist" class="flex border-b border-border-subtle" data-testid="tab-group">
      @for (tab of tabs(); track tab.id) {
        <button
          role="tab"
          type="button"
          [attr.aria-selected]="activeTab() === tab.id"
          [attr.aria-disabled]="tab.disabled ?? false"
          [class]="tabClass(tab)"
          data-testid="tab"
          (click)="onTabClick(tab)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
})
export class TabGroupComponent {
  readonly tabs = input.required<TabItem[]>();
  readonly activeTab = input.required<string>();

  readonly tabChange = output<string>();

  protected tabClass(tab: TabItem): string {
    const base =
      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2';
    if (tab.disabled)
      return `${base} border-transparent text-content-subtle cursor-not-allowed pointer-events-none`;
    if (this.activeTab() === tab.id) return `${base} border-brand text-brand`;
    return `${base} border-transparent text-content-muted hover:text-content hover:border-border`;
  }

  protected onTabClick(tab: TabItem): void {
    if (!tab.disabled) this.tabChange.emit(tab.id);
  }
}
