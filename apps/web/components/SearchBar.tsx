import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { X, Sun, Moon } from 'lucide-react';
import useSearch from '../hooks/useSearch';
import NotificationBell from './NotificationBell';
import { useTheme } from '@/context/themeContext';
import useT from '../hooks/useT';

const SearchBar: React.FC = () => {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { videos, creators } = useSearch(query);
  const { mode, toggleMode } = useTheme();
  const t = useT();

  useEffect(() => {
    const handler = setTimeout(() => setQuery(value.trim()), 300);
    return () => clearTimeout(handler);
  }, [value]);

  const clear = () => {
    setValue('');
    setQuery('');
  };

  const handleCreator = (pubkey: string) => {
    clear();
    router.push(`/p/${pubkey}`);
  };

  const handleVideo = (id: string) => {
    clear();
    router.push(`/v/${id}`);
  };

  const showDrawer = query.length > 0;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-20 flex h-12 items-center space-x-2 bg-background/80 p-2 text-foreground">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('search')}
          className="flex-1 rounded bg-background px-2 py-1 text-foreground"
        />
        {value && (
          <button onClick={clear} className="hover:text-accent">
            <X />
          </button>
        )}
        <button
          onClick={toggleMode}
          title={t('toggle_theme')}
          className="hover:text-accent"
        >
          {mode === 'dark' ? <Sun className="text-gray-900 dark:text-gray-100" /> : <Moon className="text-gray-900 dark:text-gray-100" />}
        </button>
        <NotificationBell />
      </div>
      <div
        className={`fixed inset-x-0 bottom-0 z-20 max-h-1/2 overflow-y-auto bg-background text-foreground transition-transform duration-300 ${
          showDrawer ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {creators.length > 0 && (
          <div className="p-4 border-b border-foreground/20">
            <div className="mb-2 text-sm">{t('creators')}</div>
            {creators.map((c) => (
              <div
                key={c.pubkey}
                className="flex cursor-pointer items-center space-x-3 py-2"
                onClick={() => handleCreator(c.pubkey)}
              >
                {c.picture ? (
                  <Image
                    src={c.picture}
                    alt={c.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-foreground/20" />
                )}
                <div>{c.name}</div>
              </div>
            ))}
          </div>
        )}
        {videos.length > 0 && (
          <div className="p-4">
            <div className="mb-2 text-sm">{t('videos')}</div>
            {videos.map((v) => (
              <div
                key={v.eventId}
                className="flex cursor-pointer items-center space-x-3 py-2"
                onClick={() => handleVideo(v.eventId)}
              >
                {v.posterUrl ? (
                  <Image
                    src={v.posterUrl}
                    alt="poster"
                    width={64}
                    height={48}
                    className="h-12 w-16 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-12 w-16 bg-foreground/20" />
                )}
                <div className="text-sm">{v.caption}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchBar;
