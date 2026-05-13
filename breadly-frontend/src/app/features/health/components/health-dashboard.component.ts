import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HealthResponse } from '../../../generated/api';
import { TagComponent } from '../../../shared/components/tag.component';

@Component({
  selector: 'health-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TagComponent],
  templateUrl: './health-dashboard.component.html',
})
export class HealthDashboardComponent {
  readonly health = input.required<HealthResponse>();
  readonly apiResponseTime = input<string>();
}
