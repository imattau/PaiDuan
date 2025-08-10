import React from 'react';
import MainNav from './MainNav';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Layout/MainNav' };
export default meta;

const me = {
  avatar: '/offline.jpg',
  name: 'Alice',
  username: 'alice',
  stats: { followers: 123, following: 45 },
};

type StoryFn = React.FC & { parameters?: Record<string, unknown> };

const Template = (layout: LayoutType): StoryFn => {
  const Story: StoryFn = () => (
    <LayoutContext.Provider value={layout}>
      <MainNav me={me} />
    </LayoutContext.Provider>
  );
  Story.displayName = 'MainNavStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

