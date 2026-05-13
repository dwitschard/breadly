import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RadioComponent } from './radio.component';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RadioComponent],
  template: `
    <div role="radiogroup" [attr.aria-labelledby]="groupId() + '-label'" data-testid="radio-group">
      @if (label()) {
        <p
          [id]="groupId() + '-label'"
          class="mb-2 text-sm font-medium text-content"
          data-testid="radio-group-label"
        >
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-danger" aria-hidden="true">*</span>
          }
        </p>
      }
      <div class="flex flex-col gap-2">
        @for (opt of options(); track opt.value) {
          <app-radio
            [value]="opt.value"
            [checked]="value() === opt.value"
            [disabled]="opt.disabled ?? false"
            [error]="error()"
            [warning]="warning()"
            [label]="opt.label"
            (selected)="valueChange.emit($event)"
          />
        }
      </div>
      @if ((error() || warning()) && helperText()) {
        <p class="mt-1 text-xs" [class]="helperClass()" data-testid="radio-group-helper">
          {{ helperText() }}
        </p>
      }
    </div>
  `,
})
export class RadioGroupComponent {
  readonly options = input.required<RadioOption[]>();
  readonly value = input<string>('');
  readonly label = input<string>('');
  readonly error = input<boolean>(false);
  readonly warning = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly helperText = input<string>('');
  readonly groupId = input<string>('radio-group');

  readonly valueChange = output<string>();

  protected readonly helperClass = computed(() => {
    if (this.error()) return 'text-danger-text';
    if (this.warning()) return 'text-warning-text';
    return 'text-content-subtle';
  });
}
