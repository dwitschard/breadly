import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';

@Component({
  selector: 'app-home-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HomeComponent],
  template: `
    <app-home (loginClick)="login()" />
  `,
})
export class HomeContainerComponent {
  private readonly router = inject(Router);

  login(): void {
    this.router.navigate(['/login']);
  }
}
