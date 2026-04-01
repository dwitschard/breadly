import { inject, Injectable, signal } from '@angular/core';
import { ProfileService as ProfileApiService, Profile } from '../../generated/api';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ProfileApiService);

  private readonly _profile = signal<Profile | null>(null);
  private readonly _loading = signal(false);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(): void {
    this._loading.set(true);
    this.api.getProfile().subscribe({
      next: (profile) => {
        this._profile.set(profile);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      },
    });
  }

  clear(): void {
    this._profile.set(null);
  }
}
