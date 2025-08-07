import { NostrLogin } from '../NostrLogin'

export default function Hero() {
  return (
    <section className="py-16 px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      {/* left: text and login */}
      <div className="text-center md:text-left">
        <h1 className="mb-4 text-5xl font-semibold tracking-tight">
          PaiDuan<span className="text-yellow-300">.</span>
        </h1>
        <p className="mb-8 text-lg opacity-80 max-w-md md:max-w-none">
          Lightning-fast short video, powered by Nostr and Lightning.
        </p>
        <div className="mt-8 flex justify-center md:justify-start">
          <NostrLogin />
        </div>
      </div>
      {/* right: preview grid */}
      <div></div>
    </section>
  )
}
