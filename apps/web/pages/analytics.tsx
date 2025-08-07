import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AnalyticsAlias() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const nostr = (window as any).nostr;
      if (nostr?.getPublicKey) {
        try {
          const pk = await nostr.getPublicKey();
          router.replace(`/p/${pk}/analytics`);
          return;
        } catch {
          /* ignore */
        }
      }
      setReady(true);
    }
    init();
  }, [router]);

  if (!ready) return <p>Loading...</p>;
  return <p>Sign in to view analytics.</p>;
}
