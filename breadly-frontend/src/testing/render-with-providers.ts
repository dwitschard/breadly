import { Type } from '@angular/core';
import { render, RenderComponentOptions, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TranslateModule } from '@ngx-translate/core';

export { screen, within, userEvent };

export async function renderWithProviders<T>(
  component: Type<T>,
  options: RenderComponentOptions<T> = {},
): Promise<ReturnType<typeof render<T>>> {
  const { imports = [], providers = [], ...rest } = options;
  return render(component, {
    imports: [TranslateModule.forRoot(), ...(Array.isArray(imports) ? imports : [imports])],
    providers: [...(Array.isArray(providers) ? providers : [providers])],
    ...rest,
  });
}
