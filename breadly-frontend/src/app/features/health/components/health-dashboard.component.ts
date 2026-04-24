import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HealthResponse } from '../../../generated/api';

@Component({
  selector: 'health-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <ul class="space-y-3" [attr.aria-label]="'HEALTH.CHECKS_LABEL' | translate">
      <li
        data-testid="health-check-api"
        class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
      >
        <span class="font-medium">{{ 'HEALTH.API' | translate }}</span>
        <span class="flex items-center gap-2">
          <span
            data-testid="health-check-api-status"
            [attr.data-status]="health().checks.api.status"
            class="inline-block h-2.5 w-2.5 rounded-full"
            [class.bg-green-500]="health().checks.api.status === 'ok'"
            [class.bg-red-500]="health().checks.api.status !== 'ok'"
            [attr.aria-label]="
              health().checks.api.status === 'ok'
                ? ('HEALTH.OPERATIONAL' | translate)
                : ('HEALTH.ERROR' | translate)
            "
          ></span>
          <span data-testid="health-check-api-time" class="text-sm text-gray-600">{{
            apiResponseTime() ?? ''
          }}</span>
        </span>
      </li>
      <li
        data-testid="health-check-db"
        class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
      >
        <span class="font-medium">{{ 'HEALTH.DATABASE' | translate }}</span>
        <span class="flex items-center gap-2">
          <span
            data-testid="health-check-db-status"
            [attr.data-status]="health().checks.database.status"
            class="inline-block h-2.5 w-2.5 rounded-full"
            [class.bg-green-500]="health().checks.database.status === 'ok'"
            [class.bg-red-500]="health().checks.database.status !== 'ok'"
            [attr.aria-label]="
              health().checks.database.status === 'ok'
                ? ('HEALTH.OPERATIONAL' | translate)
                : ('HEALTH.ERROR' | translate)
            "
          ></span>
        </span>
      </li>
    </ul>

    <p data-testid="health-overall-status" class="mt-6 text-sm text-gray-500">
      {{ 'HEALTH.OVERALL_STATUS' | translate }}
      <span
        class="font-semibold"
        [class.text-green-600]="health().status === 'ok'"
        [class.text-red-600]="health().status !== 'ok'"
        >{{
          health().status === 'ok'
            ? ('HEALTH.ALL_OPERATIONAL' | translate)
            : ('HEALTH.DEGRADED' | translate)
        }}</span
      >
    </p>
  `,
})
export class HealthDashboardComponent {
  readonly health = input.required<HealthResponse>();
  readonly apiResponseTime = input<string>();
}
