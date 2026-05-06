import type { Preview } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { withThemeByClassName } from '@storybook/addon-themes';
import { provideTranslateService } from '@ngx-translate/core';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [provideTranslateService()],
    }),
    withThemeByClassName({
      themes: {
        Light: '',
        Dark: 'dark',
      },
      defaultTheme: 'Light',
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
