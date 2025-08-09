import React from 'react';
import ZapModal from './ZapModal';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Overlays/ZapModal' };
export default meta;

const Template = (layout: LayoutType) => {
  function TemplateComponent() {
    return (
      <LayoutContext.Provider value={layout}>
        <OverlayHost />
        <button
          onClick={() =>
            ZapModal({
              lightningAddress: 'test@ln.tld',
              pubkey: 'pubkey',
              onSuccess: () => {},
            })
          }
        >
          Open
        </button>
      </LayoutContext.Provider>
    );
  }
  return TemplateComponent;
};

export const Desktop = Template('desktop');
export const Mobile = Template('mobile');
