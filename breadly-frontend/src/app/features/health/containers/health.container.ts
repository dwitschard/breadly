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
    <main class="p-6">
      <div class="flex items-center justify-between mb-6">
        <app-headline level="h2" data-testid="health-title">
          {{ 'HEALTH.TITLE' | translate }}
        </app-headline>
        <app-button
          data-testid="health-reload-btn"
          [icon]="LucideRefreshCw"
          [stretch]="true"
          [disabled]="healthService.healthResource.isLoading()"
          [ariaLabel]="'COMMON.RELOAD' | translate"
          (clicked)="healthService.reload()"
        />
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

      <section class="mt-8">
        <health-version-info
          [frontendVersion]="frontendVersion()"
          [backendVersion]="backendVersion()"
        />
      </section>
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
