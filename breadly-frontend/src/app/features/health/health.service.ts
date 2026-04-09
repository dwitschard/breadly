import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { OperationsService, VersionInfo } from '../../generated/api';

const DEV_FALLBACK: VersionInfo = { version: 'dev', releaseUrl: '' };

@Injectable({ providedIn: 'root' })
export class HealthFeatureService {
  private readonly api = inject(OperationsService);
  private readonly http = inject(HttpClient);

  readonly healthResource = rxResource({
    stream: () => this.api.getHealth(),
  });

  readonly backendVersionResource = rxResource({
    stream: () => this.api.getVersion().pipe(catchError(() => of(DEV_FALLBACK))),
  });

  readonly frontendVersionResource = rxResource({
    stream: () =>
      this.http.get<VersionInfo>('version.json').pipe(catchError(() => of(DEV_FALLBACK))),
  });

  reload(): void {
    this.healthResource.reload();
  }
}
