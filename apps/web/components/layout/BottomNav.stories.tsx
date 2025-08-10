import React from 'react';
import BottomNav from './BottomNav';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Layout/BottomNav' };
export default meta;

type StoryFn = React.FC & { parameters?: Record<string, unknown> };

const Template = (layout: LayoutType): StoryFn => {
  const Story: StoryFn = () => (
    <LayoutContext.Provider value={layout}>
      <BottomNav />
    </LayoutContext.Provider>
  );
  Story.displayName = 'BottomNavStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

