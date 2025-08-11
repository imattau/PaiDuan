import React from 'react';
import ReportModal from './ReportModal';
import { OverlayHost } from './ui/Overlay';
import type { LayoutType } from '@/hooks/useLayout';

const meta = { title: 'Overlays/ReportModal' };
export default meta;

const Template = (_layout: LayoutType) => {
  const Story = () => (
    <>
      <OverlayHost />
      <button onClick={() => ReportModal({ targetId: '123', targetKind: 'video' })}>Open</button>
    </>
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
