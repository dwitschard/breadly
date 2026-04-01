import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarContainerComponent } from './navbar/navbar.container';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarContainerComponent],
  template: `
    <app-navbar-container />
    <div class="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
      <router-outlet />
    </div>
  `,
})
export class LayoutComponent {}
