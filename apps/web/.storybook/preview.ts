import type { Preview } from '@storybook/react';

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
};

export default preview;

