import React from 'react';
import ReportModal from './ReportModal';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

export default { title: 'Overlays/ReportModal' };

const Template = (layout: LayoutType) => () => (
  <LayoutContext.Provider value={layout}>
    <OverlayHost />
    <button onClick={() => ReportModal({ targetId: '123', targetKind: 'video' })}>Open</button>
  </LayoutContext.Provider>
);

export const Desktop = Template('desktop');
export const Mobile = Template('mobile');
