import React, { useEffect } from 'react';
import RightPanel from './RightPanel';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';
import { useFeedSelection } from '@/store/feedSelection';

const meta = { title: 'Feed/RightPanel' };
export default meta;

type StoryFn = React.FC & { parameters?: Record<string, unknown> };

const Template = (layout: LayoutType): StoryFn => {
  const Story: StoryFn = () => {
    const setSelected = useFeedSelection((s) => s.setSelectedVideo);
    useEffect(() => {
      setSelected('vid1', 'pubkey');
    }, [setSelected]);
    return (
      <LayoutContext.Provider value={layout}>
        <RightPanel onFilterByAuthor={() => {}} />
      </LayoutContext.Provider>
    );
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

