import React from 'react';
import CommentDrawer from './CommentDrawer';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Overlays/CommentDrawer' };
export default meta;

const Template = (layout: LayoutType) => {
  const Story = () => (
    <LayoutContext.Provider value={layout}>
      <OverlayHost />
      <button onClick={() => CommentDrawer({ videoId: 'video1' })}>Open</button>
    </LayoutContext.Provider>
  );
  Story.displayName = 'CommentDrawerStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

