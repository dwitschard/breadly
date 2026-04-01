import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { OperationsService } from '../../generated/api';

@Injectable({ providedIn: 'root' })
export class HealthFeatureService {
  private readonly api = inject(OperationsService);

  readonly healthResource = rxResource({
    stream: () => this.api.getHealth(),
  });

  reload(): void {
    this.healthResource.reload();
  }
}
