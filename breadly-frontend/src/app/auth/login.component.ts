import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.login();
  }
}
