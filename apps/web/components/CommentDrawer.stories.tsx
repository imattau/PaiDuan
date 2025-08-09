import React from 'react';
import CommentDrawer from './CommentDrawer';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Overlays/CommentDrawer' };
export default meta;

const Template = (layout: LayoutType) => {
  function TemplateComponent() {
    return (
      <LayoutContext.Provider value={layout}>
        <OverlayHost />
        <button onClick={() => CommentDrawer({ videoId: 'video1' })}>Open</button>
      </LayoutContext.Provider>
    );
  }
  return TemplateComponent;
};

export const Desktop = Template('desktop');
export const Mobile = Template('mobile');
