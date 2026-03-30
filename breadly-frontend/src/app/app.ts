import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarContainerComponent } from './shared/navbar/navbar.container';
import { ConfigErrorComponent } from './config/config-error.component';
import { ConfigService } from './config/config.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarContainerComponent, ConfigErrorComponent],
  template: `
    <app-navbar-container />
    @if (configService.hasError()) {
      <app-config-error />
    } @else if (configService.isLoaded()) {
      <router-outlet />
    }
  `,
  styleUrl: './app.css',
})
export class App {
  protected readonly configService = inject(ConfigService);
}
