import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarContainerComponent } from './shared/navbar/navbar.container';
import { ConfigErrorComponent } from './config/config-error.component';
import { configLoadError } from './app.config';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarContainerComponent, ConfigErrorComponent],
  template: `
    @if (configLoadError()) {
      <app-config-error />
    } @else {
      <app-navbar-container />
      <router-outlet />
    }
  `,
  styleUrl: './app.css',
})
export class App {
  readonly configLoadError = configLoadError;
}
