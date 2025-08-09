import React from 'react';
import ZapModal from './ZapModal';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

const meta = { title: 'Overlays/ZapModal' };
export default meta;

const Template = (layout: LayoutType) => {
  const Story = () => (
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
  Story.displayName = 'ZapModalStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

