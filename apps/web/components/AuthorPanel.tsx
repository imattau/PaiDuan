export default function AuthorPanel({ pubkey, onFilter }: { pubkey?: string; onFilter: () => void }) {
  if (!pubkey) return null;
  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3 space-y-2">
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Author</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 break-all">{pubkey}</div>
      <button onClick={onFilter} className="btn btn-outline w-full">Show only this author</button>
    </div>
  );
}
