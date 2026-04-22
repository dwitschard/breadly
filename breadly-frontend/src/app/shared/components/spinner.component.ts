import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="flex items-center justify-center p-8" aria-live="polite" aria-busy="true">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
        role="status"
        [attr.aria-label]="'COMMON.LOADING' | translate"
      >
        <span class="sr-only">{{ 'COMMON.LOADING' | translate }}</span>
      </div>
    </div>
  `,
})
export class SpinnerComponent {}
