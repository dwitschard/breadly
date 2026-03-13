import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { LoginButtonComponent } from './auth/login-button.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, LoginButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly authService = inject(AuthService);

  readonly isLoggedIn = this.authService.isLoggedIn;

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }
}
