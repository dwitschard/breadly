import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HealthResponse } from '../../../generated/api';

@Component({
  selector: 'health-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <ul class="space-y-3" [attr.aria-label]="'HEALTH.CHECKS_LABEL' | translate">
      <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <span class="font-medium">{{ 'HEALTH.API' | translate }}</span>
        <span class="flex items-center gap-2">
          <span
            class="inline-block h-2.5 w-2.5 rounded-full"
            [class]="health().checks.api.status === 'ok' ? 'bg-green-500' : 'bg-red-500'"
            [attr.aria-label]="
              health().checks.api.status === 'ok'
                ? ('HEALTH.OPERATIONAL' | translate)
                : ('HEALTH.ERROR' | translate)
            "
          ></span>
          <span class="text-sm text-gray-600">{{ health().checks.api.responseTime ?? '' }}</span>
        </span>
      </li>
      <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <span class="font-medium">{{ 'HEALTH.DATABASE' | translate }}</span>
        <span class="flex items-center gap-2">
          <span
            class="inline-block h-2.5 w-2.5 rounded-full"
            [class]="health().checks.database.status === 'ok' ? 'bg-green-500' : 'bg-red-500'"
            [attr.aria-label]="
              health().checks.database.status === 'ok'
                ? ('HEALTH.OPERATIONAL' | translate)
                : ('HEALTH.ERROR' | translate)
            "
          ></span>
          <span class="text-sm text-gray-600">{{
            health().checks.database.responseTime ?? ''
          }}</span>
        </span>
      </li>
    </ul>

    <p class="mt-6 text-sm text-gray-500">
      {{ 'HEALTH.OVERALL_STATUS' | translate }}
      <span
        class="font-semibold"
        [class]="health().status === 'ok' ? 'text-green-600' : 'text-red-600'"
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
}
