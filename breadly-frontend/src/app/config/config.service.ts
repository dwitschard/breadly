import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PublicConfig, PublicConfigIdp } from '../generated/api';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);

  readonly isLoaded = signal(false);
  readonly hasError = signal(false);

  private config: PublicConfigIdp | null = null;

  constructor() {
    firstValueFrom(this.http.get<PublicConfig>('/api/public/config'))
      .then(({ idp }) => {
        this.config = idp;
        this.isLoaded.set(true);
      })
      .catch(() => this.hasError.set(true));
  }

  getConfig(): PublicConfigIdp {
    if (this.config === null) {
      throw new Error('ConfigService: config has not been initialised yet');
    }
    return this.config;
  }
}
