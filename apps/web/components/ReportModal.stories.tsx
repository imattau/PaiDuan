import React from 'react';
import ReportModal from './ReportModal';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Overlays/ReportModal' };
export default meta;

const Template = (layout: LayoutType) => {
  function TemplateComponent() {
    return (
      <LayoutContext.Provider value={layout}>
        <OverlayHost />
        <button onClick={() => ReportModal({ targetId: '123', targetKind: 'video' })}>Open</button>
      </LayoutContext.Provider>
    );
  }
  return TemplateComponent;
};

export const Desktop = Template('desktop');
export const Mobile = Template('mobile');
