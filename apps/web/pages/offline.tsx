import { useEffect, useState } from 'react';

export default function Offline() {
  const [thumbs, setThumbs] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const urls: string[] = [];
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        for (const req of requests) {
          if (/\.(jpg|jpeg|png|webm)$/.test(req.url)) {
            urls.push(req.url);
          }
        }
      }
      setThumbs(urls);
    })();
  }, []);

  return (
    <div className="p-4 text-center">
      <h1>You are offline</h1>
      <p>Previously viewed videos are available below.</p>
      <div className="flex flex-wrap justify-center" id="thumbs">
        {thumbs.map((src) => (
          <img key={src} src={src} className="w-24 h-24 object-cover m-1" />
        ))}
      </div>
    </div>
  );
}
