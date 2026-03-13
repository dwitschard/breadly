import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-login-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoggedIn()) {
      <button
        type="button"
        (click)="logoutClick.emit()"
        class="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Logout
      </button>
    } @else {
      <button
        type="button"
        (click)="loginClick.emit()"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Login
      </button>
    }
  `,
})
export class LoginButtonComponent {
  readonly isLoggedIn = input.required<boolean>();
  readonly loginClick = output();
  readonly logoutClick = output();
}
