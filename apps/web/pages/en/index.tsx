import Logo from '@/components/branding/Logo'
import HeroArt from '@/components/branding/HeroArt'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <HeroArt className="w-full h-[400px] text-foreground" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-5xl font-bold">Decentralised Short Video</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Built on Nostr. Own your keys, your audience, your revenue.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/onboarding/key"
            className="rounded-xl px-4 py-2 font-medium bg-[var(--accent)] text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          >
            Get Started
          </Link>
          <Link href="/en/feed" className="btn btn-secondary">
            Explore Feed
          </Link>
        </div>
      </div>
    </section>
  )
}
