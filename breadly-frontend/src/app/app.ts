import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfigErrorComponent } from './config/config-error.component';
import { ConfigService } from './config/config.service';
import { LayoutComponent } from './shared/layout/layout.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfigErrorComponent, LayoutComponent],
  template: `
    @if (configService.hasError()) {
      <app-config-error />
    } @else if (configService.isLoaded()) {
      <app-layout />
    }
  `,
})
export class App {
  protected readonly configService = inject(ConfigService);
}
