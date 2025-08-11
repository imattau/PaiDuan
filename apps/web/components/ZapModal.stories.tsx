import React from 'react';
import ZapModal from './ZapModal';
import { OverlayHost } from './ui/Overlay';
import type { LayoutType } from '@/hooks/useLayout';

const meta = { title: 'Overlays/ZapModal' };
export default meta;

const Template = (_layout: LayoutType) => {
  const Story = () => (
    <>
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
    </>
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

