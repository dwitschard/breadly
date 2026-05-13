import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VersionInfo } from '../../../generated/api';
import { HeadlineComponent } from '../../../shared/components/headline.component';

@Component({
  selector: 'health-version-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, HeadlineComponent],
  template: `
    <div class="bg-surface-card border border-border rounded-card p-4 sm:p-5">
      <app-headline level="h4" class="mb-3.5">{{ 'HEALTH.VERSIONS' | translate }}</app-headline>
      <ul [attr.aria-label]="'HEALTH.VERSIONS_LABEL' | translate">
        <li
          data-testid="health-version-frontend"
          class="flex items-center justify-between py-2.5 border-b border-border-subtle"
        >
          <span class="text-sm text-content-muted">{{ 'HEALTH.FRONTEND' | translate }}</span>
          @if (frontendVersion().releaseUrl) {
            <a
              data-testid="health-version-frontend-value"
              [href]="frontendVersion().releaseUrl"
              target="_blank"
              rel="noopener"
              class="text-sm font-mono font-medium text-content hover:text-link hover:underline transition-colors duration-fast"
            >
              {{ frontendVersion().version }}
            </a>
          } @else {
            <span
              data-testid="health-version-frontend-value"
              class="text-sm font-mono font-medium text-content"
            >
              {{ frontendVersion().version }}
            </span>
          }
        </li>
        <li data-testid="health-version-backend" class="flex items-center justify-between py-2.5">
          <span class="text-sm text-content-muted">{{ 'HEALTH.BACKEND' | translate }}</span>
          @if (backendVersion().releaseUrl) {
            <a
              data-testid="health-version-backend-value"
              [href]="backendVersion().releaseUrl"
              target="_blank"
              rel="noopener"
              class="text-sm font-mono font-medium text-content hover:text-link hover:underline transition-colors duration-fast"
            >
              {{ backendVersion().version }}
            </a>
          } @else {
            <span
              data-testid="health-version-backend-value"
              class="text-sm font-mono font-medium text-content"
            >
              {{ backendVersion().version }}
            </span>
          }
        </li>
      </ul>
    </div>
  `,
})
export class VersionInfoComponent {
  readonly frontendVersion = input.required<VersionInfo>();
  readonly backendVersion = input.required<VersionInfo>();
}
