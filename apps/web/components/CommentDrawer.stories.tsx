import React from 'react';
import CommentDrawer from './CommentDrawer';
import { OverlayHost } from './ui/Overlay';
import type { LayoutType } from '@/hooks/useLayout';

const meta = { title: 'Overlays/CommentDrawer' };
export default meta;

const Template = (_layout: LayoutType) => {
  const Story = () => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <OverlayHost />
        <button onClick={() => setOpen(true)}>Open</button>
        <CommentDrawer videoId="video1" open={open} onOpenChange={setOpen} />
      </>
    );
  };
  Story.displayName = 'CommentDrawerStory';
  return Story;
};

export const Desktop: any = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet: any = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile: any = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };
