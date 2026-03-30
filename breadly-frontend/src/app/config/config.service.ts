import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PublicConfig, PublicConfigIdp } from '../generated/api';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);

  private readonly _isLoaded = signal(false);
  private readonly _hasError = signal(false);

  readonly isLoaded = this._isLoaded.asReadonly();
  readonly hasError = this._hasError.asReadonly();

  private config: PublicConfigIdp | null = null;

  constructor() {
    firstValueFrom(this.http.get<PublicConfig>('api/public/config'))
      .then(({ idp }) => {
        this.config = idp;
        this._isLoaded.set(true);
      })
      .catch(() => this._hasError.set(true));
  }

  getConfig(): PublicConfigIdp {
    if (this.config === null) {
      throw new Error('ConfigService: config has not been initialised yet');
    }
    return this.config;
  }

  setConfig(config: PublicConfigIdp): void {
    this.config = config;
    this._isLoaded.set(true);
  }
}
