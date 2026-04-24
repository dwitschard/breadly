import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { OperationsService, VersionInfo } from '../../generated/api';

const DEV_FALLBACK: VersionInfo = { version: 'dev', releaseUrl: '' };

@Injectable({ providedIn: 'root' })
export class HealthFeatureService {
  private readonly api = inject(OperationsService);
  private readonly http = inject(HttpClient);

  private readonly _apiResponseTime = signal<string | undefined>(undefined);
  readonly apiResponseTime = this._apiResponseTime.asReadonly();

  readonly healthResource = rxResource({
    stream: () => {
      const start = performance.now();
      return this.api.getHealth().pipe(
        tap(() => {
          const elapsed = Math.round(performance.now() - start);
          this._apiResponseTime.set(`${elapsed}ms`);
        }),
      );
    },
  });

  readonly backendVersionResource = rxResource({
    stream: () => this.api.getVersion().pipe(catchError(() => of(DEV_FALLBACK))),
  });

  readonly frontendVersionResource = rxResource({
    stream: () =>
      this.http.get<VersionInfo>('version.json').pipe(catchError(() => of(DEV_FALLBACK))),
  });

  reload(): void {
    this._apiResponseTime.set(undefined);
    this.healthResource.reload();
  }
}
