import React, { useEffect, useState } from 'react';
import Feed from '../components/Feed';
import UploadButton from '../components/UploadButton';
import CreatorWizard from '../components/CreatorWizard';
import useFeed, { FeedMode } from '../hooks/useFeed';
import useFollowing from '../hooks/useFollowing';
import { VideoCardProps } from '../components/VideoCard';

const TAB_KEY = 'feed-tab';
const TAG_KEY = 'feed-tag';

type Tab = 'all' | 'following' | 'tags';

export default function FeedPage() {
  const { following } = useFollowing();
  const [tab, setTab] = useState<Tab>('all');
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTab = window.localStorage.getItem(TAB_KEY) as Tab | null;
    const savedTag = window.localStorage.getItem(TAG_KEY) || undefined;
    if (savedTab) setTab(savedTab);
    if (savedTag) setSelectedTag(savedTag);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TAB_KEY, tab);
    if (selectedTag) window.localStorage.setItem(TAG_KEY, selectedTag);
    else window.localStorage.removeItem(TAG_KEY);
  }, [tab, selectedTag]);

  const mode: FeedMode =
    tab === 'following'
      ? { type: 'following', authors: following }
      : tab === 'tags' && selectedTag
      ? { type: 'tag', tag: selectedTag }
      : { type: 'all' };

  const effectiveMode = tab === 'tags' && !selectedTag ? { type: 'all' } : mode;
  const { items, tags, prepend } = useFeed(effectiveMode);

  const handlePublished = (item: VideoCardProps) => {
    prepend(item);
  };

  const renderTabs = () => (
    <div className="fixed top-0 left-0 right-0 z-10 flex justify-around bg-black/80 text-white">
      {(['all', 'following', 'tags'] as Tab[]).map((t) => (
        <button
          key={t}
          onClick={() => {
            setTab(t);
            if (t !== 'tags') setSelectedTag(undefined);
          }}
          className={`flex-1 py-2 ${tab === t ? 'border-b-2 border-white' : ''}`}
        >
          {t === 'all' ? 'For You' : t === 'following' ? 'Following' : 'Tags'}
        </button>
      ))}
    </div>
  );

  const renderTagList = () => (
    <div className="pt-10 h-screen overflow-y-auto bg-black text-white">
      {tags.map((t) => (
        <div key={t} className="p-4 border-b border-white/20">
          <button
            onClick={() => {
              setSelectedTag(t);
            }}
            className="w-full text-left"
          >
            #{t}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {renderTabs()}
      {tab === 'tags' && !selectedTag ? (
        renderTagList()
      ) : (
        <Feed items={items} />
      )}
      {tab === 'tags' && selectedTag && (
        <button
          className="fixed left-4 top-2 z-20 text-white"
          onClick={() => setSelectedTag(undefined)}
        >
          Back
        </button>
      )}
      <UploadButton onClick={() => setShowWizard(true)} />
      {showWizard && (
        <CreatorWizard
          onClose={() => setShowWizard(false)}
          onPublished={handlePublished}
        />
      )}
    </>
  );
}
