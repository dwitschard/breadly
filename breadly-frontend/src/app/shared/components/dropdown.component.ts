import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full" data-testid="dropdown">
      <!-- Trigger -->
      <button
        type="button"
        [disabled]="disabled()"
        [class]="triggerClass()"
        data-testid="dropdown-trigger"
        (click)="toggleOpen($event)"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="open()"
        [attr.data-selected]="value() ?? null"
      >
        <span class="flex-1 text-left truncate" [class.text-content-subtle]="!selectedLabel()">
          {{ selectedLabel() || placeholder() }}
        </span>
        <svg
          class="h-4 w-4 shrink-0 text-content-subtle transition-transform duration-base"
          [class.rotate-180]="open()"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      <!-- Options list -->
      @if (open()) {
        <ul
          role="listbox"
          class="absolute top-full left-0 z-10 mt-1 w-full overflow-y-auto rounded-lg border border-border-subtle bg-surface-card py-1 shadow-elevated"
          style="max-height: 180px"
          data-testid="dropdown-list"
        >
          @for (opt of options(); track opt.value) {
            <li
              role="option"
              [attr.aria-selected]="value() === opt.value"
              [class]="optionClass(opt.value)"
              data-testid="dropdown-option"
              [attr.data-value]="opt.value"
              (click)="select(opt.value)"
            >
              {{ opt.label }}
            </li>
          }
        </ul>
      }

      @if (error() && helperText()) {
        <p class="mt-1 text-xs text-danger-text" data-testid="dropdown-helper">
          {{ helperText() }}
        </p>
      }
    </div>
  `,
})
export class DropdownComponent {
  readonly options = input.required<DropdownOption[]>();
  readonly value = input<string | null>(null);
  readonly placeholder = input<string>('Auswählen');
  readonly disabled = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly helperText = input<string>('');

  readonly valueChange = output<string>();

  protected readonly open = signal(false);

  protected readonly selectedLabel = computed(() => {
    const v = this.value();
    return this.options().find((o) => o.value === v)?.label ?? null;
  });

  protected readonly triggerClass = computed(() => {
    const base =
      'flex w-full items-center gap-2 h-10 rounded-lg border px-3 text-sm bg-surface-card text-content transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2';
    const errorClass = this.error() ? 'border-danger' : 'border-border hover:border-border-strong';
    const disabledClass = this.disabled() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    return `${base} ${errorClass} ${disabledClass}`;
  });

  protected optionClass(optValue: string): string {
    const base =
      'flex items-center px-3 py-[9px] text-sm cursor-pointer transition-colors duration-fast';
    const selected = this.value() === optValue;
    return selected
      ? `${base} font-medium text-brand bg-brand-muted`
      : `${base} text-content hover:bg-surface-raised`;
  }

  protected toggleOpen(event: MouseEvent): void {
    if (!this.disabled()) {
      event.stopPropagation();
      this.open.update((v) => !v);
    }
  }

  protected select(optValue: string): void {
    this.valueChange.emit(optValue);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !(event.target as Element).closest('app-dropdown')) {
      this.open.set(false);
    }
  }
}
