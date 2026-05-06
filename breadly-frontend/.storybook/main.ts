import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: [
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: { autodocs: 'tag' },
  webpackFinal: async (config) => {
    config.module?.rules?.push({
      test: /\.md$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default config;
