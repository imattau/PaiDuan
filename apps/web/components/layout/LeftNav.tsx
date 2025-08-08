'use client';
import Link from 'next/link';

export default function LeftNav({ me }: { me: { avatar: string; name: string; username: string; stats: { followers: number; following: number } } }) {
  return (
    <div className="space-y-6">
      {/* Profile mini card */}
      <div className="bg-card border border-token rounded-2xl p-4 flex items-center gap-3">
        <img src={me.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div>
          <div className="font-semibold">{me.name}</div>
          <div className="text-sm text-muted-foreground">@{me.username}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border border-token rounded-2xl p-3">
        <input
          type="search"
          placeholder="Search creators, tags…"
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {/* Nav */}
      <nav className="bg-card border border-token rounded-2xl p-2">
        <ul className="flex flex-col">
          <li><Link className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block" href="/feed">Home</Link></li>
          <li><Link className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block" href="/following">Following</Link></li>
          <li><Link className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block" href="/create">Create</Link></li>
          <li><Link className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block" href="/settings">Settings</Link></li>
        </ul>
      </nav>

      {/* Stats */}
      <div className="bg-card border border-token rounded-2xl p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Followers</span>
          <span className="font-medium">{me.stats.followers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-muted-foreground">Following</span>
          <span className="font-medium">{me.stats.following.toLocaleString()}</span>
        </div>
        <Link href="/settings" className="mt-3 inline-block text-sm underline">Profile settings</Link>
      </div>
    </div>
  );
}
