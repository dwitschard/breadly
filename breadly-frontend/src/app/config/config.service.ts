import { Injectable } from '@angular/core';
import { PublicConfigIdp } from '../generated/api';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: PublicConfigIdp | null = null;

  setConfig(idp: PublicConfigIdp): void {
    if (this.config !== null) {
      return;
    }
    this.config = idp;
  }

  getConfig(): PublicConfigIdp {
    if (this.config === null) {
      throw new Error('ConfigService: config has not been initialised yet');
    }
    return this.config;
  }
}
