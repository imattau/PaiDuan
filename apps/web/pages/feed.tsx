import React, { useEffect, useState } from 'react';
import UploadButton from '../components/UploadButton';
import CreatorWizard from '../components/CreatorWizard';
import useFeed, { FeedMode } from '../hooks/useFeed';
import useFollowing from '../hooks/useFollowing';
import { VideoCard, VideoCardProps } from '../components/VideoCard';
import SearchBar from '../components/SearchBar';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useT from '../hooks/useT';

const TAB_KEY = 'feed-tab';
const TAG_KEY = 'feed-tag';

type Tab = 'all' | 'following' | 'tags';

export default function FeedPage() {
  const router = useRouter();
  const { following } = useFollowing();
  const [tab, setTab] = useState<Tab>('all');
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showWizard, setShowWizard] = useState(false);
  const t = useT();
  const locale = (router.query.locale as string) || 'en';

  useEffect(() => {
    if (!router.isReady) return;
    const tagParam = router.query.tag as string | undefined;
    if (tagParam) {
      setTab('tags');
      setSelectedTag(tagParam);
      return;
    }
    if (typeof window === 'undefined') return;
    const savedTab = window.localStorage.getItem(TAB_KEY) as Tab | null;
    const savedTag = window.localStorage.getItem(TAG_KEY) || undefined;
    if (savedTab) setTab(savedTab);
    if (savedTag) setSelectedTag(savedTag);
  }, [router.isReady, router.query.tag]);

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
    <div className="fixed top-12 left-0 right-0 z-10 flex justify-around bg-background/80 text-foreground">
      {(['all', 'following', 'tags'] as Tab[]).map((tabKey) => (
        <button
          key={tabKey}
          onClick={() => {
            setTab(tabKey);
            if (tabKey !== 'tags') setSelectedTag(undefined);
          }}
          className={`flex-1 py-2 ${tab === tabKey ? 'border-b-2 border-foreground' : ''}`}
        >
          {tabKey === 'all' ? t('for_you') : tabKey === 'following' ? t('following') : t('tags')}
        </button>
      ))}
    </div>
  );

  const renderTagList = () => (
    <div className="pt-20 h-screen overflow-y-auto pb-14 bg-background text-foreground">
      {tags.map((t) => (
        <div key={t} className="p-4 border-b border-foreground/20">
          <Link href={`/${locale}/feed?tag=${t}`} className="block w-full text-left hover:text-accent">
            #{t}
          </Link>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <SearchBar />
      {renderTabs()}
      {tab === 'tags' && !selectedTag ? (
        renderTagList()
      ) : (
        <div className="h-[calc(100vh-104px)] overflow-y-auto snap-y snap-mandatory">
          {items.map((v) => (
            <div key={v.eventId} className="snap-center flex justify-center">
              <VideoCard {...v} />
            </div>
          ))}
        </div>
      )}
      {tab === 'tags' && selectedTag && (
        <button
          className="fixed left-4 top-14 z-20 text-foreground hover:text-accent"
          onClick={() => {
            setSelectedTag(undefined);
            router.push(`/${locale}/feed`);
          }}
        >
          {t('back')}
        </button>
      )}
      <UploadButton onClick={() => setShowWizard(true)} isOpen={showWizard} />
      {showWizard && (
        <CreatorWizard
          onClose={() => setShowWizard(false)}
          onPublished={handlePublished}
        />
      )}
    </>
  );
}
