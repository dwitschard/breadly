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
    <div
      role="tablist"
      class="flex border-b border-warm-200 dark:border-warm-700"
      data-testid="tab-group"
    >
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
      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2';
    if (tab.disabled)
      return `${base} border-transparent text-warm-400 cursor-not-allowed pointer-events-none dark:text-warm-600`;
    if (this.activeTab() === tab.id)
      return `${base} border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-400`;
    return `${base} border-transparent text-warm-600 hover:text-warm-900 hover:border-warm-300 dark:text-warm-400 dark:hover:text-warm-50 dark:hover:border-warm-600`;
  }

  protected onTabClick(tab: TabItem): void {
    if (!tab.disabled) this.tabChange.emit(tab.id);
  }
}
