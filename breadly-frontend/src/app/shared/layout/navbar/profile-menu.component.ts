import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideCircleUser } from '@lucide/angular';
import { Profile } from '../../../generated/api';

@Component({
  selector: 'app-profile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCircleUser],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    @if (!isLoggedIn()) {
      <button
        type="button"
        (click)="loginClick.emit()"
        class="px-3 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Login
      </button>
    } @else {
      <div class="relative">
        <button
          type="button"
          [attr.aria-haspopup]="'menu'"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-label]="'Account menu for ' + displayName()"
          (click)="toggle()"
          class="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer"
        >
          @if (profile()?.picture) {
            <img
              [src]="profile()!.picture"
              [alt]="displayName()"
              class="w-full h-full object-cover"
            />
          } @else {
            <svg lucideCircleUser [size]="36" aria-hidden="true" class="text-gray-400" />
          }
        </button>

        @if (isOpen()) {
          <div
            role="menu"
            aria-label="Account options"
            class="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50"
          >
            <div class="px-4 py-3 border-b border-gray-100" role="presentation">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ displayName() }}</p>
              <p class="text-xs text-gray-500 truncate">{{ profile()?.email }}</p>
            </div>
            <div class="py-1" role="presentation">
              <button
                type="button"
                role="menuitem"
                (click)="onProfileClick()"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer"
              >
                View profile
              </button>
              <button
                type="button"
                role="menuitem"
                (click)="onLogoutClick()"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class ProfileMenuComponent {
  readonly profile = input.required<Profile | null>();
  readonly isLoggedIn = input.required<boolean>();

  readonly profileClick = output<void>();
  readonly logoutClick = output<void>();
  readonly loginClick = output<void>();

  protected readonly isOpen = signal(false);

  private readonly elementRef = inject(ElementRef);

  protected displayName(): string {
    const p = this.profile();
    if (!p) return '';
    return p.name ?? p.givenName ?? p.email;
  }

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onProfileClick(): void {
    this.close();
    this.profileClick.emit();
  }

  protected onLogoutClick(): void {
    this.close();
    this.logoutClick.emit();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
