import PlaceholderVideo from './PlaceholderVideo';

export default function VideoFeed({ onAuthorClick }: { onAuthorClick: (pubkey: string) => void }) {
  const videos: unknown[] = [];

  if (videos.length === 0) {
    return <PlaceholderVideo className="aspect-[9/16] w-full max-w-[420px] mx-auto text-primary" />;
  }

  return (
    <div className="text-gray-900 dark:text-gray-100">
      Video feed placeholder
    </div>
  );
}
