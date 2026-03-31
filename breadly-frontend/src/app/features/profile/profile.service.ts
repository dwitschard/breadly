import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserProfile } from './profile.types';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _loading = signal(false);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(): void {
    this._loading.set(true);
    this.http.get<UserProfile>('api/profile').subscribe({
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
