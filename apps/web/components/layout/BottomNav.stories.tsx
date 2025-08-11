import React from 'react';
import BottomNav from './BottomNav';
import type { LayoutType } from '@/hooks/useLayout';

const meta = { title: 'Layout/BottomNav' };
export default meta;

const Template = (_layout: LayoutType) => {
  const Story = () => <BottomNav />;
  Story.displayName = 'BottomNavStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

