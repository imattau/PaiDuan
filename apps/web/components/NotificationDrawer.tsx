import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useRouter } from 'next/router';

const NotificationDrawer: React.FC = () => {
  const { notifications, open, setOpen, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  const handleClick = (id: string, noteId: string) => {
    markAsRead(id);
    setOpen(false);
    if (noteId) router.push(`/v/${noteId}`);
  };

  return (
    <div
      className={
        `fixed top-12 left-0 right-0 z-30 max-h-1/2 transform overflow-y-auto bg-black text-white transition-transform duration-300 ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`
      }
    >
      <div className="flex items-center justify-between border-b border-white/20 p-2">
        <span className="font-semibold">Notifications</span>
        {notifications.length > 0 && (
          <button
            className="text-sm text-blue-400"
            onClick={() => {
              markAllAsRead();
              setOpen(false);
            }}
          >
            Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 && (
        <div className="p-4 text-center text-sm">No new notifications</div>
      )}
      {notifications.map((n) => (
        <div
          key={n.id}
          className="cursor-pointer border-b border-white/20 p-3"
          onClick={() => handleClick(n.id, n.noteId)}
        >
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-gray-500" />
            <div>
              <div className="text-sm">
                {n.type === 'zap'
                  ? `${n.from.slice(0, 8)} zapped you ${n.amount ?? 0} sats`
                  : `${n.from.slice(0, 8)} replied: ${n.text}`}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(n.created_at * 1000).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationDrawer;
