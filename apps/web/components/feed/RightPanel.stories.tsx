import React from 'react';
import RightPanel from './RightPanel';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Feed/RightPanel' };
export default meta;

const author = {
  avatar: '/offline.jpg',
  name: 'Alice',
  username: 'alice',
  pubkey: 'pubkey',
  followers: 123,
};

const Template = (layout: LayoutType) => {
  const Story = () => (
    <LayoutContext.Provider value={layout}>
      <RightPanel author={author} onFilterByAuthor={() => {}} />
    </LayoutContext.Provider>
  );
  Story.displayName = 'RightPanelStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

