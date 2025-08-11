import React from 'react';
import type { Preview } from '@storybook/react';
import { LayoutProvider } from '@/hooks/useLayout';

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
      },
    },
  },
  decorators: [
    (Story) => (
      <LayoutProvider>
        <Story />
      </LayoutProvider>
    ),
  ],
};

export default preview;

