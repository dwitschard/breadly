import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideRefreshCw } from '@lucide/angular';
import { HealthFeatureService } from '../health.service';
import { HealthDashboardComponent } from '../components/health-dashboard.component';
import { VersionInfoComponent } from '../components/version-info.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner.component';
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
    LucideRefreshCw,
    TranslateModule,
  ],
  template: `
    <main class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">{{ 'HEALTH.TITLE' | translate }}</h1>
        <button
          type="button"
          (click)="healthService.reload()"
          [disabled]="healthService.healthResource.isLoading()"
          [attr.aria-label]="'COMMON.RELOAD' | translate"
          class="p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          [attr.aria-busy]="healthService.healthResource.isLoading()"
        >
          <svg lucideRefreshCw [size]="18" aria-hidden="true" />
        </button>
      </div>

      @if (healthService.healthResource.isLoading()) {
        <app-spinner />
      } @else if (healthService.healthResource.error()) {
        <app-error-banner [message]="'HEALTH.LOAD_ERROR' | translate" />
      } @else if (health()) {
        <health-dashboard [health]="health()!" />
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
  protected readonly healthService = inject(HealthFeatureService);
  protected readonly health = computed(() => this.healthService.healthResource.value());
  protected readonly frontendVersion = computed(
    () => this.healthService.frontendVersionResource.value() ?? DEV_FALLBACK,
  );
  protected readonly backendVersion = computed(
    () => this.healthService.backendVersionResource.value() ?? DEV_FALLBACK,
  );
}
