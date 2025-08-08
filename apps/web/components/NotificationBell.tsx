import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationBell: React.FC = () => {
  const { unreadCount, setOpen } = useNotifications();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? unreadCount : 0;

  return (
    <button onClick={() => setOpen(true)} className="relative text-foreground hover:text-accent">
      <Bell className="h-5 w-5" />
      <span
        className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs text-white  ${
          count > 0 ? '' : 'hidden'
        }`}
      >
        {count}
      </span>
    </button>
  );
};

export default NotificationBell;
