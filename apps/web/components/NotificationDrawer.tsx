import React, { useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useRouter } from 'next/navigation';
import useFocusTrap from '../hooks/useFocusTrap';

  const NotificationDrawer: React.FC = () => {
    const { notifications, open, setOpen, markAsRead, markAllAsRead } = useNotifications();
    const router = useRouter();
    const drawerRef = useRef<HTMLDivElement>(null);

    useFocusTrap(open, drawerRef as unknown as React.RefObject<HTMLElement>);

  const handleClick = (id: string, noteId: string) => {
    markAsRead(id);
    setOpen(false);
    if (noteId) router.push(`/v/${noteId}`);
  };

  if (notifications.length === 0) return null;

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className={`fixed top-12 left-0 right-0 z-30 max-h-1/2 transform overflow-y-auto bg-background-primary text-primary transition-transform duration-300 ${
        open ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex items-center justify-between border-b divider p-2">
        <span className="font-semibold">Notifications</span>
        <button
          className="text-sm text-accent-primary"
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
          className="cursor-pointer border-b divider p-3"
          onClick={() => handleClick(n.id, n.noteId)}
        >
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-text-primary/20" />
            <div>
              <div className="text-sm">
                {n.type === 'zap'
                  ? `${n.from.slice(0, 8)} zapped you ${n.amount ?? 0} sats`
                  : `${n.from.slice(0, 8)} replied: ${n.text}`}
              </div>
              <div className="text-xs text-primary/50">
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
