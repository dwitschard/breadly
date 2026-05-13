import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideRefreshCw } from '@lucide/angular';
import { HealthFeatureService } from '../health.service';
import { HealthDashboardComponent } from '../components/health-dashboard.component';
import { VersionInfoComponent } from '../components/version-info.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner.component';
import { ButtonComponent } from '../../../shared/components/button.component';
import { HeadlineComponent } from '../../../shared/components/headline.component';
import { VersionInfo } from '../../../generated/api';

const DEV_FALLBACK: VersionInfo = { version: 'dev', releaseUrl: '' };

@Component({
  selector: 'health-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HealthDashboardComponent,
    VersionInfoComponent,
    SpinnerComponent,
    ErrorBannerComponent,
    ButtonComponent,
    HeadlineComponent,
    TranslateModule,
  ],
  template: `
    <main class="max-w-3xl mx-auto py-8 flex flex-col gap-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-content-subtle uppercase tracking-caps mb-1.5">
            {{ 'HEALTH.ADMIN_AREA' | translate }}
          </p>
          <app-headline level="h2" data-testid="health-title">
            {{ 'HEALTH.TITLE' | translate }}
          </app-headline>
        </div>
        <app-button
          data-testid="health-reload-btn"
          [variant]="'secondary'"
          [icon]="LucideRefreshCw"
          [disabled]="healthService.healthResource.isLoading()"
          [ariaLabel]="'COMMON.RELOAD' | translate"
          (clicked)="healthService.reload()"
          >{{ 'HEALTH.RELOAD_BTN' | translate }}</app-button
        >
      </div>

      @if (healthService.healthResource.isLoading()) {
        <app-spinner />
      } @else if (healthService.healthResource.error()) {
        <app-error-banner [message]="'HEALTH.LOAD_ERROR' | translate" />
      } @else if (health()) {
        <health-dashboard
          [health]="health()!"
          [apiResponseTime]="healthService.apiResponseTime()"
        />
      }

      <health-version-info
        [frontendVersion]="frontendVersion()"
        [backendVersion]="backendVersion()"
      />
    </main>
  `,
})
export class HealthContainerComponent {
  protected readonly LucideRefreshCw = LucideRefreshCw;
  protected readonly healthService = inject(HealthFeatureService);
  protected readonly health = computed(() => this.healthService.healthResource.value());
  protected readonly frontendVersion = computed(
    () => this.healthService.frontendVersionResource.value() ?? DEV_FALLBACK,
  );
  protected readonly backendVersion = computed(
    () => this.healthService.backendVersionResource.value() ?? DEV_FALLBACK,
  );
}
