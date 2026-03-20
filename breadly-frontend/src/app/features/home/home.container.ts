import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HomeComponent } from './home.component';

@Component({
  selector: 'app-home-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HomeComponent],
  template: ` <app-home [isLoggedIn]="authService.isLoggedIn()" (loginClick)="login()" /> `,
})
export class HomeContainerComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  login(): void {
    this.router.navigate(['/login']);
  }
}
