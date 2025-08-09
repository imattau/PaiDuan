import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-viewport'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, '../'),
      'next/navigation': path.resolve(__dirname, './next-navigation.mock.ts'),
    };
    return config;
  },
};

export default config;

