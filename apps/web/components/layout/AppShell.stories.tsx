import React from 'react';
import AppShell from './AppShell';
import type { LayoutType } from '@/hooks/useLayout';

const meta = { title: 'Layout/AppShell' };
export default meta;

const Template = (_layout: LayoutType) => {
  const Story = () => (
    <AppShell left={<div>Left</div>} center={<div>Center</div>} right={<div>Right</div>} />
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

