import { useRouter } from 'next/router';

export default function Home() {
  const r = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand to-purple-500 text-white">
      <h1 className="mb-4 text-5xl font-semibold tracking-tight">
        PaiDuan<span className="text-yellow-300">.</span>
      </h1>
      <p className="mb-8 text-lg opacity-80 max-w-md text-center">
        Lightning-fast short video, powered by Nostr and Lightning.
      </p>
      <button
        onClick={() => r.push('/en/feed')}
        className="rounded-full bg-white/10 px-6 py-3 backdrop-blur hover:bg-white/20"
      >
        Enter feed
      </button>
    </div>
  );
}
