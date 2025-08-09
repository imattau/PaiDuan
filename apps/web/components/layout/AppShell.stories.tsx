import React from 'react';
import AppShell from './AppShell';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Layout/AppShell' };
export default meta;

const Template = (layout: LayoutType) => {
  const Story = () => (
    <LayoutContext.Provider value={layout}>
      <AppShell left={<div>Left</div>} center={<div>Center</div>} right={<div>Right</div>} />
    </LayoutContext.Provider>
  );
  Story.displayName = 'AppShellStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

