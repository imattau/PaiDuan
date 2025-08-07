import { NostrLogin } from '../components/NostrLogin'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand to-purple-500 text-white">
      <h1 className="mb-4 text-5xl font-semibold tracking-tight">
        PaiDuan<span className="text-yellow-300">.</span>
      </h1>
      <p className="mb-8 text-lg opacity-80 max-w-md text-center">
        Lightning-fast short video, powered by Nostr and Lightning.
      </p>
      <div className="mt-8 flex justify-center">
        <NostrLogin />
      </div>
    </div>
  );
}
