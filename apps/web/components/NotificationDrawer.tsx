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

  if (notifications.length === 0) return null;

  return (
    <div
      className={`fixed top-12 left-0 right-0 z-30 max-h-1/2 transform overflow-y-auto bg-background text-foreground transition-transform duration-300 ${
        open ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-foreground/20 p-2">
        <span className="font-semibold">Notifications</span>
        <button
          className="text-sm text-accent"
          onClick={() => {
            markAllAsRead();
            setOpen(false);
          }}
        >
          Mark all read
        </button>
      </div>
      {notifications.map((n) => (
        <div
          key={n.id}
          className="cursor-pointer border-b border-foreground/20 p-3"
          onClick={() => handleClick(n.id, n.noteId)}
        >
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-foreground/20" />
            <div>
              <div className="text-sm">
                {n.type === 'zap'
                  ? `${n.from.slice(0, 8)} zapped you ${n.amount ?? 0} sats`
                  : `${n.from.slice(0, 8)} replied: ${n.text}`}
              </div>
              <div className="text-xs text-foreground/50">
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
