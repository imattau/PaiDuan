export default function ThreadedComments({ noteId }: { noteId?: string }) {
  if (!noteId) return null;
  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3">
      <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Comments</h3>
      {/* TODO: subscribe to kind 1 with e=noteId; simple list for now */}
      <p className="text-xs text-gray-600 dark:text-gray-400">Thread will render here.</p>
    </div>
  );
}
