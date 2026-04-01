import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HealthFeatureService } from '../health.service';
import { HealthDashboardComponent } from '../components/health-dashboard.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner.component';

@Component({
  selector: 'health-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HealthDashboardComponent, SpinnerComponent, ErrorBannerComponent],
  template: `
    <main class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Systemstatus</h1>
        <button
          type="button"
          (click)="healthService.reload()"
          [disabled]="healthService.healthResource.isLoading()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          [attr.aria-busy]="healthService.healthResource.isLoading()"
        >
          {{ healthService.healthResource.isLoading() ? 'Laden...' : 'Aktualisieren' }}
        </button>
      </div>

      @if (healthService.healthResource.isLoading()) {
        <app-spinner />
      } @else if (healthService.healthResource.error()) {
        <app-error-banner message="Systemstatus konnte nicht abgerufen werden." />
      } @else if (health()) {
        <health-dashboard [health]="health()!" />
      }
    </main>
  `,
})
export class HealthContainerComponent {
  protected readonly healthService = inject(HealthFeatureService);
  protected readonly health = computed(() => this.healthService.healthResource.value());
}
