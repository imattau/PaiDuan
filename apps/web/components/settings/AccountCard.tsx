import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';

export function AccountCard() {
  const { signOut } = useAuth();
  const handleLogout = () => {
    signOut();
    window.location.href = '/';
  };

  return (
    <Card title="Account">
      <button onClick={handleLogout} className="btn btn-secondary">
        🔓 Logout / Reset Identity
      </button>
    </Card>
  );
}

export default AccountCard;
