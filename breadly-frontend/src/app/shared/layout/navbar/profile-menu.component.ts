import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideCircleUser } from '@lucide/angular';
import { Profile } from '../../../generated/api';
import { profileDisplayName } from '../../helpers/profile-display-name';

@Component({
  selector: 'app-profile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCircleUser, TranslateModule],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  templateUrl: './profile-menu.component.html',
})
export class ProfileMenuComponent {
  readonly profile = input.required<Profile | null>();
  readonly isLoggedIn = input.required<boolean>();
  readonly isAdmin = input.required<boolean>();

  readonly profileClick = output<void>();
  readonly logoutClick = output<void>();
  readonly loginClick = output<void>();
  readonly healthClick = output<void>();

  protected readonly isOpen = signal(false);
  protected readonly displayName = computed(() => profileDisplayName(this.profile()));

  private readonly elementRef = inject(ElementRef);

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onProfileClick(): void {
    this.close();
    this.profileClick.emit();
  }

  protected onHealthClick(): void {
    this.close();
    this.healthClick.emit();
  }

  protected onLogoutClick(): void {
    this.close();
    this.logoutClick.emit();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
