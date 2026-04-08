import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VersionInfo } from '../../../generated/api';

@Component({
  selector: 'health-version-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <h2 class="mb-3 text-lg font-semibold">{{ 'HEALTH.VERSIONS' | translate }}</h2>
    <ul class="space-y-3" aria-label="Versionen">
      <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <span class="font-medium">Frontend</span>
        @if (frontendVersion().releaseUrl) {
          <a
            [href]="frontendVersion().releaseUrl"
            target="_blank"
            rel="noopener"
            class="text-sm font-mono text-blue-600 hover:underline"
          >
            {{ frontendVersion().version }}
          </a>
        } @else {
          <span class="text-sm font-mono text-gray-600">{{ frontendVersion().version }}</span>
        }
      </li>
      <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <span class="font-medium">Backend</span>
        @if (backendVersion().releaseUrl) {
          <a
            [href]="backendVersion().releaseUrl"
            target="_blank"
            rel="noopener"
            class="text-sm font-mono text-blue-600 hover:underline"
          >
            {{ backendVersion().version }}
          </a>
        } @else {
          <span class="text-sm font-mono text-gray-600">{{ backendVersion().version }}</span>
        }
      </li>
    </ul>
  `,
})
export class VersionInfoComponent {
  readonly frontendVersion = input.required<VersionInfo>();
  readonly backendVersion = input.required<VersionInfo>();
}
