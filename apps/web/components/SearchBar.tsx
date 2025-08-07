import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';
import useSearch from '../hooks/useSearch';
import NotificationBell from './NotificationBell';

const SearchBar: React.FC = () => {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { videos, creators } = useSearch(query);

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
      <div className="fixed top-0 left-0 right-0 z-20 flex h-12 items-center space-x-2 bg-black/80 p-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search"
          className="flex-1 rounded px-2 py-1 text-black"
        />
        {value && (
          <button onClick={clear} className="text-white">
            <X />
          </button>
        )}
        <NotificationBell />
      </div>
      <div
        className={`fixed inset-x-0 bottom-0 z-20 max-h-1/2 overflow-y-auto bg-black text-white transition-transform duration-300 ${
          showDrawer ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {creators.length > 0 && (
          <div className="p-4 border-b border-white/20">
            <div className="mb-2 text-sm">Creators</div>
            {creators.map((c) => (
              <div
                key={c.pubkey}
                className="flex cursor-pointer items-center space-x-3 py-2"
                onClick={() => handleCreator(c.pubkey)}
              >
                {c.picture ? (
                  <img
                    src={c.picture}
                    alt={c.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-500" />
                )}
                <div>{c.name}</div>
              </div>
            ))}
          </div>
        )}
        {videos.length > 0 && (
          <div className="p-4">
            <div className="mb-2 text-sm">Videos</div>
            {videos.map((v) => (
              <div
                key={v.eventId}
                className="flex cursor-pointer items-center space-x-3 py-2"
                onClick={() => handleVideo(v.eventId)}
              >
                {v.posterUrl ? (
                  <img
                    src={v.posterUrl}
                    alt="poster"
                    className="h-12 w-16 object-cover"
                  />
                ) : (
                  <div className="h-12 w-16 bg-gray-500" />
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
