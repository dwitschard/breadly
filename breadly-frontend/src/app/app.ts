import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarContainerComponent } from './shared/navbar/navbar.container';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
