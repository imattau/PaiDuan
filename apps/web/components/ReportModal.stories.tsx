import React from 'react';
import ReportModal from './ReportModal';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Overlays/ReportModal' };
export default meta;

const Template = (layout: LayoutType) => {
  const Story = () => (
    <LayoutContext.Provider value={layout}>
      <OverlayHost />
      <button onClick={() => ReportModal({ targetId: '123', targetKind: 'video' })}>Open</button>
    </LayoutContext.Provider>
  );
  Story.displayName = 'ReportModalStory';
  return Story;
};

export const Desktop: any = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet: any = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile: any = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };
