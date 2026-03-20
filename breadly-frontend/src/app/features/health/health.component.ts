import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface HealthCheck {
  status: 'ok' | 'error';
  message: string;
}

interface HealthResponse {
  status: 'ok' | 'degraded';
  checks: {
    api: HealthCheck;
    database: HealthCheck;
  };
}

@Component({
  selector: 'app-health',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="max-w-2xl mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">System Health</h1>
        <button
          type="button"
          (click)="load()"
          [disabled]="loading()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          [attr.aria-busy]="loading()"
        >
          {{ loading() ? 'Reloading…' : 'Reload' }}
        </button>
      </div>

      @if (loading()) {
        <p aria-live="polite" aria-busy="true">Checking system status…</p>
      } @else if (fetchError()) {
        <p role="alert" class="text-red-600">{{ fetchError() }}</p>
        @if (duration() !== null) {
          <p class="mt-2 text-xs text-gray-400">Checked in {{ duration() }} ms</p>
        }
      } @else if (health()) {
        <ul class="space-y-3" aria-label="System status checks">
          <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <span class="font-medium">API</span>
            <span class="flex items-center gap-2">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                [class]="health()!.checks.api.status === 'ok' ? 'bg-green-500' : 'bg-red-500'"
                [attr.aria-label]="health()!.checks.api.status === 'ok' ? 'Operational' : 'Error'"
              ></span>
              <span class="text-sm text-gray-600">{{ health()!.checks.api.message }}</span>
            </span>
          </li>
          <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <span class="font-medium">Database</span>
            <span class="flex items-center gap-2">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                [class]="health()!.checks.database.status === 'ok' ? 'bg-green-500' : 'bg-red-500'"
                [attr.aria-label]="health()!.checks.database.status === 'ok' ? 'Operational' : 'Error'"
              ></span>
              <span class="text-sm text-gray-600">{{ health()!.checks.database.message }}</span>
            </span>
          </li>
        </ul>

        <p class="mt-6 text-sm text-gray-500">
          Overall status:
          <span
            class="font-semibold"
            [class]="health()!.status === 'ok' ? 'text-green-600' : 'text-red-600'"
          >{{ health()!.status === 'ok' ? 'All systems operational' : 'Degraded' }}</span>
        </p>

        @if (duration() !== null) {
          <p class="mt-2 text-xs text-gray-400">Checked in {{ duration() }} ms</p>
        }
      }
    </main>
  `,
})
export class HealthComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly health = signal<HealthResponse | null>(null);
  readonly loading = signal(true);
  readonly fetchError = signal<string | null>(null);
  readonly duration = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.health.set(null);
    this.fetchError.set(null);
    this.duration.set(null);

    const startTime = Date.now();

    this.http.get<HealthResponse>('/api/health').subscribe({
      next: (data) => {
        this.health.set(data);
        this.duration.set(Date.now() - startTime);
        this.loading.set(false);
      },
      error: () => {
        this.fetchError.set('Failed to reach the health endpoint.');
        this.duration.set(Date.now() - startTime);
        this.loading.set(false);
      },
    });
  }
}
