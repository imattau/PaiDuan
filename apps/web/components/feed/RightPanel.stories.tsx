import React, { useEffect } from 'react';
import RightPanel from './RightPanel';
import type { LayoutType } from '@/hooks/useLayout';
import { useFeedSelection } from '@/store/feedSelection';

const meta = { title: 'Feed/RightPanel' };
export default meta;

const Template = (_layout: LayoutType) => {
  const Story = () => {
    const setSelected = useFeedSelection((s) => s.setSelectedVideo);
    useEffect(() => {
      setSelected('vid1', 'pubkey');
    }, [setSelected]);
    return <RightPanel onFilterByAuthor={() => {}} />;
  };
  Story.displayName = 'RightPanelStory';
  return Story;
};

export const Desktop = Template('desktop');
Desktop.parameters = { viewport: { defaultViewport: 'desktop' } };

export const Tablet = Template('tablet');
Tablet.parameters = { viewport: { defaultViewport: 'tablet' } };

export const Mobile = Template('mobile');
Mobile.parameters = { viewport: { defaultViewport: 'mobile' } };

