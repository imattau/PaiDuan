import React from 'react';
import ZapModal from './ZapModal';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

export default { title: 'Overlays/ZapModal' };

const Template = (layout: LayoutType) => () => (
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

export const Desktop = Template('desktop');
export const Mobile = Template('mobile');
