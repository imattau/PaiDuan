import React from 'react';
import CommentDrawer from './CommentDrawer';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

export default { title: 'Overlays/CommentDrawer' };

const Template = (layout: LayoutType) => () => (
  <LayoutContext.Provider value={layout}>
    <OverlayHost />
    <button onClick={() => CommentDrawer({ videoId: 'video1' })}>Open</button>
  </LayoutContext.Provider>
);

export const Desktop = Template('desktop');
export const Mobile = Template('mobile');
