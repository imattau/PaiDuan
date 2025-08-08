import Link from 'next/link';

export default function MiniProfileCard() {
  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3 text-center">
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">@user</div>
      <Link href="/en/settings#profile" className="text-xs text-[var(--accent)]">
        Manage profile
      </Link>
    </div>
  );
}
