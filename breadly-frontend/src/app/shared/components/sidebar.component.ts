import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    @if (open() || _visible()) {
      <!-- Scrim -->
      <div
        class="fixed inset-0 z-40 bg-black/50 transition-opacity duration-slide"
        [class.opacity-0]="!_visible()"
        [class.opacity-100]="_visible()"
        data-testid="sidebar-scrim"
        aria-hidden="true"
        (click)="dismissed.emit()"
      ></div>

      <!-- Panel -->
      <aside
        class="fixed bottom-0 right-0 top-0 z-50 flex w-sidebar max-w-[calc(100vw-48px)] flex-col bg-surface-card shadow-elevated transition-transform duration-slide ease-spring"
        [class.translate-x-full]="!_visible()"
        [class.translate-x-0]="_visible()"
        role="dialog"
        aria-modal="true"
        data-testid="sidebar"
      >
        <!-- Header -->
        <div
          class="flex shrink-0 items-center justify-between border-b border-border-subtle px-6 py-4"
        >
          <h2 class="text-lg font-medium text-content" data-testid="sidebar-title">
            {{ title() }}
          </h2>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-content-subtle transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus"
            data-testid="sidebar-close"
            [attr.aria-label]="'COMMON.CANCEL' | translate"
            (click)="dismissed.emit()"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              class="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6" data-testid="sidebar-body">
          <ng-content />
        </div>

        <!-- Footer -->
        <div class="shrink-0 border-t border-border-subtle p-4" data-testid="sidebar-footer">
          <ng-content select="[slot=footer]" />
        </div>
      </aside>
    }
  `,
})
export class SidebarComponent {
  readonly title = input.required<string>();
  readonly open = input<boolean>(false);

  readonly dismissed = output<void>();

  readonly _visible = signal(false);

  constructor() {
    effect(() => {
      if (this.open()) {
        setTimeout(() => this._visible.set(true), 0);
      } else {
        this._visible.set(false);
      }
    });
  }
}
