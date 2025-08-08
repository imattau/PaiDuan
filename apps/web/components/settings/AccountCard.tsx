import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '../ui/Card';

export function AccountCard() {
  const { signOut } = useAuth();
  return (
    <Card title="Account">
      <button
        onClick={() => {
          signOut();
          window.location.href = '/';
        }}
        className="btn btn-secondary"
      >
        🔓 Logout / Reset Identity
      </button>
    </Card>
  );
}

export default AccountCard;
