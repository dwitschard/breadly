import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from './button.component';
import { SpinnerComponent } from './spinner.component';

@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, SpinnerComponent, TranslateModule],
  styles: [`
    dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
  `],
  template: `
    <dialog
      #dialogRef
      class="w-full max-w-[448px] rounded-2xl bg-white p-0 shadow-xl dark:bg-warm-900 m-auto"
      data-testid="dialog"
      (click)="onDialogClick($event)"
      (cancel)="onNativeCancel($event)"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 border-b border-warm-200 px-6 py-4 dark:border-warm-700">
        @if (destructive()) {
          <svg
            class="h-5 w-5 shrink-0 text-amber-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>
        }
        <h2 class="flex-1 text-lg font-medium text-warm-900 dark:text-warm-50" data-testid="dialog-title">
          {{ title() }}
        </h2>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:hover:bg-warm-800 dark:hover:text-warm-50"
          data-testid="dialog-close"
          [attr.aria-label]="'COMMON.CANCEL' | translate"
          (click)="cancel.emit()"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            class="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 text-sm text-warm-600 dark:text-warm-300" data-testid="dialog-body">
        @if (loading()) {
          <div class="flex justify-center py-4">
            <app-spinner size="md" />
          </div>
        } @else {
          <ng-content />
        }
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 border-t border-warm-200 px-6 py-4 dark:border-warm-700">
        <app-button
          variant="ghost"
          [disabled]="loading()"
          data-testid="dialog-cancel"
          (clicked)="cancel.emit()"
        >
          {{ 'COMMON.CANCEL' | translate }}
        </app-button>

        <button
          type="button"
          [disabled]="loading()"
          [class]="confirmClass()"
          data-testid="dialog-confirm"
          (click)="confirm.emit()"
        >
          <ng-content select="[slot=confirm]" />
        </button>
      </div>
    </dialog>
  `,
})
export class DialogComponent {
  readonly title       = input.required<string>();
  readonly open        = input<boolean>(false);
  readonly loading     = input<boolean>(false);
  readonly destructive = input<boolean>(false);

  readonly confirm   = output<void>();
  readonly cancel    = output<void>();
  readonly dismissed = output<void>();

  protected readonly confirmClass = computed(() => {
    const base =
      'inline-flex h-[38px] items-center justify-center rounded-[10px] px-4 text-sm font-medium transition-all duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
    return this.destructive()
      ? `${base} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400`
      : `${base} bg-amber-600 text-amber-950 hover:bg-amber-700 focus-visible:ring-amber-400 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400`;
  });

  private readonly dialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef().nativeElement;
      if (this.open()) {
        if (!dialog.open) dialog.showModal();
      } else {
        if (dialog.open) dialog.close();
      }
    });
  }

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) {
      this.dismissed.emit();
    }
  }

  protected onNativeCancel(event: Event): void {
    event.preventDefault();
    this.dismissed.emit();
  }
}
