import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VersionInfo } from '../../../generated/api';
import { HeadlineComponent } from '../../../shared/components/headline.component';

@Component({
  selector: 'health-version-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, HeadlineComponent],
  template: `
    <app-headline level="h4" class="mb-3">{{ 'HEALTH.VERSIONS' | translate }}</app-headline>
    <ul class="space-y-3" [attr.aria-label]="'HEALTH.VERSIONS_LABEL' | translate">
      <li
        data-testid="health-version-frontend"
        class="flex items-center justify-between rounded-lg border border-border px-4 py-3"
      >
        <span class="font-medium">{{ 'HEALTH.FRONTEND' | translate }}</span>
        @if (frontendVersion().releaseUrl) {
          <a
            data-testid="health-version-frontend-value"
            [href]="frontendVersion().releaseUrl"
            target="_blank"
            rel="noopener"
            class="text-sm font-mono text-link hover:underline"
          >
            {{ frontendVersion().version }}
          </a>
        } @else {
          <span
            data-testid="health-version-frontend-value"
            class="text-sm font-mono text-content-muted"
          >
            {{ frontendVersion().version }}
          </span>
        }
      </li>
      <li
        data-testid="health-version-backend"
        class="flex items-center justify-between rounded-lg border border-border px-4 py-3"
      >
        <span class="font-medium">{{ 'HEALTH.BACKEND' | translate }}</span>
        @if (backendVersion().releaseUrl) {
          <a
            data-testid="health-version-backend-value"
            [href]="backendVersion().releaseUrl"
            target="_blank"
            rel="noopener"
            class="text-sm font-mono text-link hover:underline"
          >
            {{ backendVersion().version }}
          </a>
        } @else {
          <span
            data-testid="health-version-backend-value"
            class="text-sm font-mono text-content-muted"
          >
            {{ backendVersion().version }}
          </span>
        }
      </li>
    </ul>
  `,
})
export class VersionInfoComponent {
  readonly frontendVersion = input.required<VersionInfo>();
  readonly backendVersion = input.required<VersionInfo>();
}
