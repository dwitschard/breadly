import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UserProfile } from './profile.types';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="max-w-xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-6">Profile</h1>

      @if (loading()) {
        <p aria-live="polite">Loading profile&hellip;</p>
      } @else if (profile()) {
        <div class="flex flex-col gap-6">
          <!-- Avatar + name -->
          <div class="flex items-center gap-4">
            @if (profile()!.picture) {
              <img
                [src]="profile()!.picture"
                [alt]="displayName()"
                class="w-16 h-16 rounded-full object-cover border border-gray-200"
              />
            } @else {
              <svg
                viewBox="0 0 64 64"
                aria-hidden="true"
                class="w-16 h-16 rounded-full bg-gray-200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="32" cy="22" r="13" fill="#9ca3af" />
                <path d="M6 60c0-14.359 11.641-26 26-26s26 11.641 26 26" fill="#9ca3af" />
              </svg>
            }
            <div>
              <p class="text-lg font-semibold text-gray-900">{{ displayName() }}</p>
              <p class="text-sm text-gray-500">{{ profile()!.email }}</p>
            </div>
          </div>

          <!-- Details -->
          <dl class="divide-y divide-gray-100 rounded-lg border border-gray-200">
            @if (profile()!.givenName) {
              <div class="px-4 py-3 flex justify-between">
                <dt class="text-sm font-medium text-gray-500">First name</dt>
                <dd class="text-sm text-gray-900">{{ profile()!.givenName }}</dd>
              </div>
            }
            @if (profile()!.familyName) {
              <div class="px-4 py-3 flex justify-between">
                <dt class="text-sm font-medium text-gray-500">Last name</dt>
                <dd class="text-sm text-gray-900">{{ profile()!.familyName }}</dd>
              </div>
            }
            <div class="px-4 py-3 flex justify-between">
              <dt class="text-sm font-medium text-gray-500">Email</dt>
              <dd class="text-sm text-gray-900 flex items-center gap-2">
                {{ profile()!.email }}
                @if (profile()!.emailVerified) {
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
                    aria-label="Email verified"
                    >Verified</span
                  >
                } @else {
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700"
                    aria-label="Email not verified"
                    >Unverified</span
                  >
                }
              </dd>
            </div>
            <div class="px-4 py-3 flex justify-between">
              <dt class="text-sm font-medium text-gray-500">User ID</dt>
              <dd class="text-sm text-gray-500 font-mono break-all">{{ profile()!.sub }}</dd>
            </div>
            @if (profile()!.roles.length > 0) {
              <div class="px-4 py-3 flex justify-between items-start">
                <dt class="text-sm font-medium text-gray-500">Roles</dt>
                <dd class="flex flex-wrap gap-1 justify-end">
                  @for (role of profile()!.roles; track role) {
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                    >
                      {{ role }}
                    </span>
                  }
                </dd>
              </div>
            }
          </dl>
        </div>
      } @else {
        <p class="text-gray-500">Profile information is unavailable.</p>
      }
    </main>
  `,
})
export class ProfileComponent {
  readonly profile = input.required<UserProfile | null>();
  readonly loading = input.required<boolean>();

  protected displayName(): string {
    const p = this.profile();
    if (!p) return '';
    return p.name ?? p.givenName ?? p.email;
  }
}
