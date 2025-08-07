import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationBell: React.FC = () => {
  const { unreadCount, setOpen } = useNotifications();
  return (
    <button onClick={() => setOpen(true)} className="relative text-white">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
